import * as m from '$lib/paraglide/messages'
import LayoutDashboardIcon from '@lucide/svelte/icons/layout-dashboard'
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
] as const satisfies SidebarRoute[]
