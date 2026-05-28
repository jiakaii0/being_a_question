import { Tool } from '@modelcontextprotocol/sdk/types.js'

const DATE_RANGE_SCHEMA = {
  type: 'object' as const,
  description: 'Date range. Use preset for quick selection, or start+end for custom range.',
  properties: {
    preset: {
      type: 'string',
      enum: ['today', 'week', 'month'],
      description: 'Quick preset. Defaults to "today" if nothing is provided.',
    },
    start: {
      type: 'string',
      description: 'ISO 8601 datetime e.g. "2026-05-01T00:00:00". Use with end.',
    },
    end: {
      type: 'string',
      description: 'ISO 8601 datetime e.g. "2026-05-28T23:59:59". Use with start.',
    },
  },
}

const CATEGORY_ENUM = ['Logistics', 'Return/Refund', 'ShopeeFood', 'Account & Fraud', 'Shopee Payment', 'Monee', 'Others']

export const TOOL_DEFINITIONS: Tool[] = [
  {
    name: 'get_summary',
    description: 'Get the overall CSAT summary for a date range: total chats, good/bad/average/unrated counts, CSAT %, and comparison vs the previous equivalent period.',
    inputSchema: {
      type: 'object',
      properties: {
        date_range: DATE_RANGE_SCHEMA,
      },
    },
  },
  {
    name: 'get_ews_alerts',
    description: 'Get Early Warning System (EWS) alerts for the given period. Returns active alerts for CSAT threshold breaches, week-on-week CSAT drops, bad rating spikes per intent, and volume surges. Best tool for answering "is anything on fire right now?"',
    inputSchema: {
      type: 'object',
      properties: {
        date_range: DATE_RANGE_SCHEMA,
        severity_filter: {
          type: 'string',
          enum: ['all', 'critical', 'warning'],
          description: 'Filter alerts by severity. Defaults to "all".',
        },
      },
    },
  },
  {
    name: 'get_trend',
    description: 'Get CSAT trend data over time, bucketed by hour or day. Use "hourly" granularity for today or short ranges, "daily" for weekly/monthly views.',
    inputSchema: {
      type: 'object',
      properties: {
        date_range: DATE_RANGE_SCHEMA,
        granularity: {
          type: 'string',
          enum: ['daily', 'hourly'],
          description: 'Time bucket size. Defaults to "daily".',
        },
        include_previous_period: {
          type: 'boolean',
          description: 'If true, also returns the prior equivalent period trend for comparison. Defaults to false.',
        },
      },
    },
  },
  {
    name: 'get_intent_breakdown',
    description: 'Get per-intent CSAT metrics: total chats, good/bad counts, CSAT %, resolved %. Sortable and filterable by category. Use to identify which intents are performing worst.',
    inputSchema: {
      type: 'object',
      properties: {
        date_range: DATE_RANGE_SCHEMA,
        category_filter: {
          type: 'string',
          enum: CATEGORY_ENUM,
          description: 'Filter to a single business category.',
        },
        sort_by: {
          type: 'string',
          enum: ['bad_count', 'csat', 'total'],
          description: 'Sort field. Defaults to "bad_count" (most bad ratings first).',
        },
        limit: {
          type: 'number',
          description: 'Max number of intents to return. Defaults to 20, max 100.',
        },
        min_total: {
          type: 'number',
          description: 'Exclude intents with fewer than this many total chats. Defaults to 10.',
        },
      },
    },
  },
  {
    name: 'get_heatmap',
    description: 'Get the bad rating heatmap: a matrix of intent × hour showing bad rating counts. Useful for identifying which intents are worst at which times of day.',
    inputSchema: {
      type: 'object',
      properties: {
        date_range: DATE_RANGE_SCHEMA,
        top_n: {
          type: 'number',
          description: 'Number of top intents (by bad count) to include. Defaults to 20, max 50. Keep low to avoid large payloads.',
        },
        category_filter: {
          type: 'string',
          enum: CATEGORY_ENUM,
          description: 'Filter to a single business category before selecting top_n intents.',
        },
      },
    },
  },
]
