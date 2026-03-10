export const categoryColors = [
  'slate',
  'rose',
  'emerald',
  'amber',
  'sky',
  'violet',
  'orange',
  'teal',
] as const

export const colorClasses = {
  slate: {
    circle: 'bg-slate-500',
    header: 'bg-slate-500/10 dark:bg-slate-500/15',
    badge: 'text-slate-600 dark:text-slate-400',
  },
  rose: {
    circle: 'bg-rose-500',
    header: 'bg-rose-500/10 dark:bg-rose-500/15',
    badge: 'text-rose-600 dark:text-rose-400',
  },
  emerald: {
    circle: 'bg-emerald-500',
    header: 'bg-emerald-500/10 dark:bg-emerald-500/15',
    badge: 'text-emerald-600 dark:text-emerald-400',
  },
  amber: {
    circle: 'bg-amber-500',
    header: 'bg-amber-500/10 dark:bg-amber-500/15',
    badge: 'text-amber-600 dark:text-amber-400',
  },
  sky: {
    circle: 'bg-sky-500',
    header: 'bg-sky-500/10 dark:bg-sky-500/15',
    badge: 'text-sky-600 dark:text-sky-400',
  },
  violet: {
    circle: 'bg-violet-500',
    header: 'bg-violet-500/10 dark:bg-violet-500/15',
    badge: 'text-violet-600 dark:text-violet-400',
  },
  orange: {
    circle: 'bg-orange-500',
    header: 'bg-orange-500/10 dark:bg-orange-500/15',
    badge: 'text-orange-600 dark:text-orange-400',
  },
  teal: {
    circle: 'bg-teal-500',
    header: 'bg-teal-500/10 dark:bg-teal-500/15',
    badge: 'text-teal-600 dark:text-teal-400',
  },
} as const satisfies Record<
  CategoryColor,
  { circle: string; header: string; badge: string }
>

export type CategoryColor = (typeof categoryColors)[number]
