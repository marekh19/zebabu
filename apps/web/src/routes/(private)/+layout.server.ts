import { resolve } from '$app/paths'
import { redirect } from '@sveltejs/kit'
import type { LayoutServerLoad } from './$types'

export const load: LayoutServerLoad = ({ locals }) => {
  if (!locals.user || !locals.session) {
    redirect(302, resolve('/auth/login'))
  }

  return { user: locals.user, session: locals.session }
}
