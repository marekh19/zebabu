import type { OperationErrorCode } from '$lib/operation-result'
import type { Profile } from '@zebabu/api-contract'

declare global {
  namespace App {
    interface Error {
      code?: OperationErrorCode
    }
    interface Locals {
      locale: string
      requestId: string
      user: Profile | null
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
