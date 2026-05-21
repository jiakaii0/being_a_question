import { csatBgClass } from '@/lib/csatUtils'

interface Props {
  value: number
  size?: 'sm' | 'md' | 'lg'
}

export default function CsatBadge({ value, size = 'md' }: Props) {
  const cls = csatBgClass(value)
  const sizeClass = size === 'lg' ? 'text-3xl font-extrabold px-4 py-2 rounded-xl' :
                    size === 'sm' ? 'text-xs font-semibold px-2 py-0.5 rounded' :
                                   'text-sm font-bold px-3 py-1 rounded-lg'
  return (
    <span className={`inline-block ${cls} ${sizeClass}`}>
      {value.toFixed(1)}%
    </span>
  )
}
