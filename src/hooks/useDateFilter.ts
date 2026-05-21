'use client'
import { useState, useCallback } from 'react'
import { DateRange, QuickFilter } from '@/types'
import { getQuickRange } from '@/lib/csatUtils'

export function useDateFilter() {
  const [quickFilter, setQuickFilter] = useState<QuickFilter>('today')
  const [range, setRange] = useState<DateRange>(() => getQuickRange('today'))

  const selectQuick = useCallback((f: 'today' | 'week' | 'month') => {
    setQuickFilter(f)
    setRange(getQuickRange(f))
  }, [])

  const selectCustom = useCallback((r: DateRange) => {
    setQuickFilter('custom')
    setRange(r)
  }, [])

  return { quickFilter, range, selectQuick, selectCustom }
}
