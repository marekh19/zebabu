import type { auth } from '$lib/auth'

type Session = typeof auth.$Infer.Session

declare global {
  namespace App {
    // interface Error {}
    interface Locals {
      session: Session['session'] | null
      user: Session['user'] | null
    }
    interface PageData {
      /** Maps dynamic path segments (e.g. an ID) to display labels for breadcrumbs. */
      breadcrumbSegments?: Record<string, string>
    }
    // interface PageState {}
    // interface Platform {}
  }
}

export {}
