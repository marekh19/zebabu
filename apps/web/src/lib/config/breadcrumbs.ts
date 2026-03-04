import { sidebarRoutes } from './navigation'

export type Breadcrumb = {
  label: string
  href: string
  isLast: boolean
}

const staticLabels = Object.fromEntries(
  sidebarRoutes.map((route) => [route.segment, route.label]),
)

export function buildBreadcrumbs(
  pathname: string,
  dynamicLabels: Record<string, string>,
): Breadcrumb[] {
  const segments = pathname.split('/').filter(Boolean)
  return segments.map((segment, i) => ({
    label: staticLabels[segment]?.() ?? dynamicLabels[segment] ?? segment,
    href: '/' + segments.slice(0, i + 1).join('/'),
    isLast: i === segments.length - 1,
  }))
}
