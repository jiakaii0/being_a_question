'use client'
import { useMemo } from 'react'
import { HeatmapCell } from '@/types'

interface Props { cells: HeatmapCell[] }

export default function IntentHeatmap({ cells }: Props) {
  const { intents, matrix, maxVal } = useMemo(() => {
    if (cells.length === 0) return { intents: [], matrix: new Map(), maxVal: 1 }

    const intentOrder: string[] = []
    const seen = new Set<string>()
    for (const c of cells) {
      if (!seen.has(c.intentId)) { intentOrder.push(c.intentId); seen.add(c.intentId) }
    }

    const matrix = new Map<string, number[]>()
    for (const c of cells) {
      if (!matrix.has(c.intentId)) matrix.set(c.intentId, Array(24).fill(0))
      matrix.get(c.intentId)![c.hour] = c.badCount
    }

    let maxVal = 1
    for (const row of matrix.values()) for (const v of row) if (v > maxVal) maxVal = v

    // Keep only intents with at least 1 bad rating
    const filtered = intentOrder.filter(id => (matrix.get(id) ?? []).some(v => v > 0))

    const nameMap = new Map(cells.map(c => [c.intentId, `${c.intentId} - ${c.intentName.slice(0, 30)}`]))

    return { intents: filtered.map(id => ({ id, label: nameMap.get(id) ?? id })), matrix, maxVal }
  }, [cells])

  if (intents.length === 0) {
    return (
      <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
        <h2 className="font-semibold text-gray-800 mb-2">Bad Rating Heatmap</h2>
        <div className="h-32 flex items-center justify-center text-gray-400 text-sm">No data for selected period</div>
      </div>
    )
  }

  const CELL_W = 28
  const CELL_H = 22
  const LABEL_W = 200

  function cellColor(count: number): string {
    if (count === 0) return '#f9fafb'
    const t = count / maxVal
    // Shopee orange → red gradient
    const r = Math.round(238 + (180 - 238) * t)
    const g = Math.round(77  + (0   - 77)  * t)
    const b = Math.round(45  + (0   - 45)  * t)
    return `rgb(${r},${g},${b})`
  }

  const HOURS = Array.from({ length: 24 }, (_, i) => i)

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <h2 className="font-semibold text-gray-800">Bad Rating Heatmap <span className="text-gray-400 font-normal text-sm">(intent × hour)</span></h2>
        <div className="flex items-center gap-1 text-xs text-gray-500">
          <span>Low</span>
          {[0, 0.25, 0.5, 0.75, 1].map(t => {
            const r = Math.round(238 + (180 - 238) * t)
            const g = Math.round(77  + (0   - 77)  * t)
            const b = Math.round(45  + (0   - 45)  * t)
            return <div key={t} className="w-4 h-3 rounded-sm" style={{ backgroundColor: t === 0 ? '#f9fafb' : `rgb(${r},${g},${b})` }} />
          })}
          <span>High</span>
        </div>
      </div>

      <div className="overflow-auto max-h-[480px]">
        <div style={{ minWidth: LABEL_W + CELL_W * 24 + 8 }}>
          {/* Hour header */}
          <div className="flex" style={{ paddingLeft: LABEL_W }}>
            {HOURS.map(h => (
              <div key={h} className="text-center text-gray-400 font-mono" style={{ width: CELL_W, fontSize: 9 }}>
                {h < 10 ? `0${h}` : h}
              </div>
            ))}
          </div>

          {/* Rows */}
          {intents.map(({ id, label }) => (
            <div key={id} className="flex items-center">
              <div className="text-xs text-gray-600 truncate pr-2 shrink-0" style={{ width: LABEL_W, height: CELL_H, lineHeight: `${CELL_H}px` }} title={label}>
                {label}
              </div>
              {HOURS.map(h => {
                const count = matrix.get(id)?.[h] ?? 0
                return (
                  <div key={h} title={`${label} · Hour ${h}:00 — ${count} bad`}
                    className="rounded-sm shrink-0 flex items-center justify-center"
                    style={{ width: CELL_W - 2, height: CELL_H - 2, margin: 1, backgroundColor: cellColor(count), cursor: count > 0 ? 'pointer' : 'default' }}
                  >
                    {count > 0 && (
                      <span style={{ fontSize: 7, color: 'white', fontWeight: 600, lineHeight: 1, userSelect: 'none' }}>
                        {count}
                      </span>
                    )}
                  </div>
                )
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
