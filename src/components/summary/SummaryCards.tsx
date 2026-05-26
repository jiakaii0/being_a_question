import { DashboardSummary } from '@/types'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import CsatBadge from './CsatBadge'

interface Props { summary: DashboardSummary }

export default function SummaryCards({ summary }: Props) {
  const { total, good, bad, average, unrated, csat, csatDelta } = summary
  const rated = good + bad

  const trendColor = csatDelta > 0 ? 'text-green-500' : csatDelta < 0 ? 'text-red-500' : 'text-gray-400'
  const trendArrow = csatDelta > 0 ? '▲' : csatDelta < 0 ? '▼' : '—'

  const cards = [
    {
      title: 'Total Chats',
      value: total.toLocaleString(),
      sub: `${average} avg rated · ${unrated} unrated`,
      icon: '💬',
    },
    {
      title: 'CSAT Score',
      value: null,
      badge: csat,
      sub: (
        <span className={`font-semibold ${trendColor}`}>
          {trendArrow} {Math.abs(csatDelta).toFixed(1)}pp vs prev period
        </span>
      ),
      icon: '📊',
    },
    {
      title: 'Good Ratings',
      value: good.toLocaleString(),
      sub: rated > 0 ? `${((good / rated) * 100).toFixed(1)}% of rated` : '—',
      icon: '👍',
      valueClass: 'text-green-500',
    },
    {
      title: 'Bad Ratings',
      value: bad.toLocaleString(),
      sub: rated > 0 ? `${((bad / rated) * 100).toFixed(1)}% of rated` : '—',
      icon: '👎',
      valueClass: 'text-red-500',
    },
  ]

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card, i) => (
        <Card key={i} className="border border-gray-200 dark:border-gray-700 shadow-sm bg-white dark:bg-gray-800">
          <CardHeader className="pb-1 pt-4 px-4">
            <CardTitle className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider flex items-center gap-1">
              <span>{card.icon}</span> {card.title}
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            {card.badge !== undefined ? (
              <CsatBadge value={card.badge} size="lg" />
            ) : (
              <p className={`text-3xl font-extrabold ${card.valueClass ?? 'text-gray-800 dark:text-gray-100'}`}>{card.value}</p>
            )}
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{card.sub}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
