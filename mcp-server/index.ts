import 'dotenv/config'
import express from 'express'
import { Server } from '@modelcontextprotocol/sdk/server/index.js'
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js'
import { ListToolsRequestSchema, CallToolRequestSchema } from '@modelcontextprotocol/sdk/types.js'
import { TOOL_DEFINITIONS } from './toolDefinitions'
import { handleGetSummary } from './tools/getSummary'
import { handleGetEwsAlerts } from './tools/getEwsAlerts'
import { handleGetTrend } from './tools/getTrend'
import { handleGetIntentBreakdown } from './tools/getIntentBreakdown'
import { handleGetHeatmap } from './tools/getHeatmap'

const PORT = Number(process.env.MCP_PORT ?? 3001)

function createMcpServer() {
  const server = new Server(
    { name: 'shopee-csat', version: '1.0.0' },
    { capabilities: { tools: {} } }
  )

  server.setRequestHandler(ListToolsRequestSchema, async () => ({
    tools: TOOL_DEFINITIONS,
  }))

  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params
    const a = (args ?? {}) as Record<string, unknown>
    switch (name) {
      case 'get_summary':          return handleGetSummary(a)
      case 'get_ews_alerts':       return handleGetEwsAlerts(a)
      case 'get_trend':            return handleGetTrend(a)
      case 'get_intent_breakdown': return handleGetIntentBreakdown(a)
      case 'get_heatmap':          return handleGetHeatmap(a)
      default: throw new Error(`Unknown tool: ${name}`)
    }
  })

  return server
}

const app = express()
app.use(express.json())

app.post('/mcp', async (req, res) => {
  const server = createMcpServer()
  const transport = new StreamableHTTPServerTransport({ sessionIdGenerator: undefined })
  await server.connect(transport)
  await transport.handleRequest(req, res, req.body)
})

app.get('/mcp', (_req, res) => {
  res.status(405).json({ error: 'Use POST /mcp for Streamable HTTP transport' })
})

app.listen(PORT, () => {
  console.log(`Shopee CSAT MCP server running on port ${PORT}`)
  console.log(`Endpoint: http://localhost:${PORT}/mcp`)
})
