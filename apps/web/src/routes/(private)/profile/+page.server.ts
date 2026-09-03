import { primaryCurrencySchema, profileSchema } from '$lib/identity/currencies'
import { superValidate } from 'sveltekit-superforms'
import { zod4 } from 'sveltekit-superforms/adapters'
import type { PageServerLoad } from './$types'

export const load: PageServerLoad = async ({ locals }) => ({
  form: await superValidate(
    {
      primaryCurrency: primaryCurrencySchema
        .catch('USD')
        .parse(locals.user?.primaryCurrency),
    },
    zod4(profileSchema),
  ),
})
