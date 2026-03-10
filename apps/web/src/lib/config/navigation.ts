import * as m from '$lib/paraglide/messages'
import LayoutDashboardIcon from '@lucide/svelte/icons/layout-dashboard'
import TagIcon from '@lucide/svelte/icons/tag'
import WalletIcon from '@lucide/svelte/icons/wallet'
import type { Component } from 'svelte'

export type SidebarRoute = {
  segment: string
  path: string
  label: () => string
  icon: Component
}

export const sidebarRoutes = [
  {
    segment: 'dashboard',
    path: '/dashboard',
    label: m.sidebar_nav_dashboard,
    icon: LayoutDashboardIcon,
  },
  {
    segment: 'budgets',
    path: '/budgets',
    label: m.sidebar_nav_budgets,
    icon: WalletIcon,
  },
  {
    segment: 'categories',
    path: '/categories',
    label: m.sidebar_nav_categories,
    icon: TagIcon,
  },
] as const satisfies SidebarRoute[]
