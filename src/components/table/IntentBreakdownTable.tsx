'use client'
import { useState, useMemo } from 'react'
import { IntentStat } from '@/types'
import { RC_CATEGORIES } from '@/lib/intentMap'
import CsatBadge from '@/components/summary/CsatBadge'

interface Props { intentStats: IntentStat[] }

export default function IntentBreakdownTable({ intentStats }: Props) {
  const [search, setSearch] = useState('')
  const [sortKey, setSortKey] = useState<keyof IntentStat>('bad')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc')
  const [expandedCats, setExpandedCats] = useState<Set<string>>(new Set())
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set())

  function toggleSort(key: keyof IntentStat) {
    if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setSortKey(key); setSortDir('desc') }
  }

  function toggleCat(cat: string) {
    setExpandedCats(prev => { const n = new Set(prev); n.has(cat) ? n.delete(cat) : n.add(cat); return n })
  }

  function toggleRow(id: string) {
    setExpandedRows(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n })
  }

  const filtered = useMemo(() => {
    const q = search.toLowerCase()
    return intentStats
      .filter(s => !q || s.intentId.includes(q) || s.intentName.toLowerCase().includes(q) || s.category.toLowerCase().includes(q))
      .sort((a, b) => {
        const av = a[sortKey] as number
        const bv = b[sortKey] as number
        return sortDir === 'asc' ? av - bv : bv - av
      })
  }, [intentStats, search, sortKey, sortDir])

  const grouped = useMemo(() => {
    const map = new Map<string, IntentStat[]>()
    for (const cat of RC_CATEGORIES) map.set(cat, [])
    for (const s of filtered) {
      const cat = s.category
      if (!map.has(cat)) map.set(cat, [])
      map.get(cat)!.push(s)
    }
    return map
  }, [filtered])

  function catSummary(stats: IntentStat[]) {
    const good = stats.reduce((a, s) => a + s.good, 0)
    const bad  = stats.reduce((a, s) => a + s.bad,  0)
    const total= stats.reduce((a, s) => a + s.total, 0)
    const csat = good + bad > 0 ? Math.round((good / (good + bad)) * 1000) / 10 : 0
    return { good, bad, total, csat }
  }

  const SortIcon = ({ k }: { k: keyof IntentStat }) =>
    <span className="ml-0.5 text-gray-400">{sortKey === k ? (sortDir === 'asc' ? '↑' : '↓') : '↕'}</span>

  const COL = 'px-3 py-2 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider cursor-pointer select-none whitespace-nowrap hover:text-shopee-500'

  return (
    <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
      <div className="flex items-center justify-between p-4 border-b border-gray-100">
        <h2 className="font-semibold text-gray-800">Intent & RC Breakdown</h2>
        <input
          type="text" placeholder="Search intent or category…" value={search} onChange={e => setSearch(e.target.value)}
          className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm w-52 focus:outline-none focus:border-shopee-400"
        />
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className={`${COL} pl-4`}>Intent</th>
              <th className={COL} onClick={() => toggleSort('total')}>Total <SortIcon k="total" /></th>
              <th className={COL} onClick={() => toggleSort('good')}>Good <SortIcon k="good" /></th>
              <th className={COL} onClick={() => toggleSort('bad')}>Bad <SortIcon k="bad" /></th>
              <th className={COL} onClick={() => toggleSort('csat')}>CSAT <SortIcon k="csat" /></th>
              <th className={COL} onClick={() => toggleSort('resolvedPct')}>Resolved % <SortIcon k="resolvedPct" /></th>
            </tr>
          </thead>
          <tbody>
            {Array.from(grouped.entries()).map(([cat, stats]) => {
              if (stats.length === 0) return null
              const sum = catSummary(stats)
              const isOpen = expandedCats.has(cat)
              return [
                // Category header row
                <tr key={`cat-${cat}`} className="bg-shopee-50 hover:bg-shopee-100 cursor-pointer" onClick={() => toggleCat(cat)}>
                  <td colSpan={6} className="px-4 py-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-gray-400 text-xs">{isOpen ? '▼' : '▶'}</span>
                        <span className="font-semibold text-shopee-700 text-sm">{cat}</span>
                        <span className="text-xs text-gray-500">({stats.length} intents · {sum.total.toLocaleString()} chats)</span>
                      </div>
                      <CsatBadge value={sum.csat} size="sm" />
                    </div>
                  </td>
                </tr>,
                // Intent rows
                ...(isOpen ? stats.map(s => [
                  <tr key={s.intentId} className="border-t border-gray-100 hover:bg-gray-50 cursor-pointer" onClick={() => toggleRow(s.intentId)}>
                    <td className="px-4 py-2 pl-8">
                      <div className="font-medium text-gray-800 text-xs">{s.intentId}</div>
                      <div className="text-gray-500 text-xs truncate max-w-xs" title={s.intentName}>{s.intentName}</div>
                    </td>
                    <td className="px-3 py-2 text-gray-700 tabular-nums">{s.total.toLocaleString()}</td>
                    <td className="px-3 py-2 text-green-600 font-medium tabular-nums">{s.good.toLocaleString()}</td>
                    <td className="px-3 py-2 text-red-500 font-medium tabular-nums">{s.bad.toLocaleString()}</td>
                    <td className="px-3 py-2"><CsatBadge value={s.csat} size="sm" /></td>
                    <td className="px-3 py-2 text-gray-600 tabular-nums">{s.resolvedPct.toFixed(1)}%</td>
                  </tr>,
                  // Expanded sparkline row
                  expandedRows.has(s.intentId) ? (
                    <tr key={`${s.intentId}-exp`} className="bg-gray-50 border-t border-gray-100">
                      <td colSpan={6} className="px-8 py-3">
                        <p className="text-xs font-semibold text-gray-500 mb-1">Bad ratings by hour</p>
                        <div className="flex items-end gap-0.5 h-10">
                          {s.hourlyBad.map((count, h) => {
                            const maxH = Math.max(...s.hourlyBad, 1)
                            const pct = (count / maxH) * 100
                            return (
                              <div key={h} title={`${h}:00 — ${count} bad`}
                                className="flex-1 rounded-t"
                                style={{ height: `${Math.max(pct, 2)}%`, backgroundColor: count > 0 ? '#EE4D2D' : '#e5e7eb', minWidth: 3 }}
                              />
                            )
                          })}
                        </div>
                        <div className="flex justify-between text-gray-400 text-xs mt-0.5">
                          <span>00:00</span><span>12:00</span><span>23:00</span>
                        </div>
                      </td>
                    </tr>
                  ) : null
                ]).flat().filter(Boolean) : [])
              ]
            })}
          </tbody>
        </table>
      </div>

      {filtered.length === 0 && (
        <div className="p-8 text-center text-gray-400 text-sm">No intents match your search.</div>
      )}
    </div>
  )
}
