import type { auth } from '$lib/auth'

type Session = typeof auth.$Infer.Session

declare global {
  namespace App {
    // interface Error {}
    interface Locals {
      session: Session['session'] | null
      user: Session['user'] | null
    }
    // interface PageData {}
    // interface PageState {}
    // interface Platform {}
  }
}

export {}
