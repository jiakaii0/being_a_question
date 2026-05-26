'use client'
import { useState } from 'react'
import { EWSAlert } from '@/types'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'

interface Props { alerts: EWSAlert[] }

const TYPE_ICON: Record<string, string> = {
  csat_threshold: '📉',
  wow_drop:       '📆',
  bad_spike:      '🔺',
  volume_surge:   '📈',
}

const TYPE_LABEL: Record<string, string> = {
  csat_threshold: 'CSAT Below Threshold',
  wow_drop:       'Period-on-Period Drop',
  bad_spike:      'Bad Rating Spike',
  volume_surge:   'Volume Surge',
}

export default function EWSPanel({ alerts }: Props) {
  const [open, setOpen] = useState(true)

  if (alerts.length === 0) {
    return (
      <div className="flex items-center gap-2 bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-lg px-4 py-3 text-green-700 dark:text-green-400 text-sm font-medium">
        ✅ No active alerts — all metrics look healthy
      </div>
    )
  }

  const critCount = alerts.filter(a => a.severity === 'critical').length
  const warnCount = alerts.filter(a => a.severity === 'warning').length

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <CollapsibleTrigger className="w-full">
        <div className={`flex items-center justify-between px-4 py-3 rounded-t-lg border cursor-pointer ${
          critCount > 0
            ? 'bg-red-50 dark:bg-red-950 border-red-300 dark:border-red-800'
            : 'bg-yellow-50 dark:bg-yellow-950 border-yellow-300 dark:border-yellow-800'
        }`}>
          <div className="flex items-center gap-2">
            <span className="text-lg">{critCount > 0 ? '🚨' : '⚠️'}</span>
            <span className="font-semibold text-sm">
              {critCount > 0 && <span className="text-red-700 dark:text-red-400">{critCount} Critical</span>}
              {critCount > 0 && warnCount > 0 && <span className="text-gray-400 mx-1">·</span>}
              {warnCount > 0 && <span className="text-yellow-700 dark:text-yellow-400">{warnCount} Warning</span>}
            </span>
            <span className="text-gray-500 dark:text-gray-400 text-xs">EWS Alerts</span>
          </div>
          <span className="text-gray-400 text-sm">{open ? '▲' : '▼'}</span>
        </div>
      </CollapsibleTrigger>

      <CollapsibleContent>
        <div className="border border-t-0 border-gray-200 dark:border-gray-700 rounded-b-lg divide-y divide-gray-100 dark:divide-gray-700">
          {alerts.map((alert, i) => {
            const isCrit = alert.severity === 'critical'
            return (
              <div key={i} className={`flex items-start gap-3 px-4 py-3 ${
                isCrit ? 'bg-red-50 dark:bg-red-950/50' : 'bg-yellow-50 dark:bg-yellow-950/50'
              }`}>
                <span className="text-xl mt-0.5">{TYPE_ICON[alert.type]}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`text-xs font-bold uppercase tracking-wide ${isCrit ? 'text-red-600 dark:text-red-400' : 'text-yellow-700 dark:text-yellow-400'}`}>
                      {TYPE_LABEL[alert.type]}
                    </span>
                    {alert.category && (
                      <span className="text-xs bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded px-1.5 py-0.5">{alert.category}</span>
                    )}
                  </div>
                  <p className="text-sm font-medium text-gray-800 dark:text-gray-200 mt-0.5">{alert.message}</p>
                  {alert.detail && <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{alert.detail}</p>}
                  {alert.intentName && (
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 truncate">Intent: {alert.intentName}</p>
                  )}
                </div>
                <span className={`text-xs font-bold px-2 py-0.5 rounded-full shrink-0 ${
                  isCrit ? 'bg-red-200 dark:bg-red-900 text-red-800 dark:text-red-300' : 'bg-yellow-200 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-300'
                }`}>
                  {isCrit ? 'CRITICAL' : 'WARN'}
                </span>
              </div>
            )
          })}
        </div>
      </CollapsibleContent>
    </Collapsible>
  )
}
