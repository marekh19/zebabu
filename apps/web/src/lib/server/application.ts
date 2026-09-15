import { env } from '$env/dynamic/private'
import { createIdentity } from '$lib/identity/server'
import { readIdentityEnvironment } from '$lib/identity/server/environment'

export const auth = createIdentity(readIdentityEnvironment(env))
