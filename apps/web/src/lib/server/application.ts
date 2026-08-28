import { seedDefaultCategories } from '$lib/budget-planning/server'
import { createIdentity } from '$lib/identity/server'

export const auth = createIdentity({
  onUserCreated: seedDefaultCategories,
})
