type IdentityEnvironment = Readonly<{
  betterAuthUrl: string
  webOrigin: string
  redisKeyPrefix: string
}>

function origin(value: string | undefined, name: string) {
  if (!value) throw new Error(`${name} is not set`)
  const parsed = new URL(value)
  if (parsed.origin !== value.replace(/\/$/, '')) {
    throw new Error(`${name} must be an origin without a path`)
  }
  return parsed.origin
}

export function readIdentityEnvironment(
  environment: Record<string, string | undefined>,
): IdentityEnvironment {
  const applicationEnvironment = environment.APP_ENV
  if (!applicationEnvironment || !/^[a-z0-9-]+$/.test(applicationEnvironment)) {
    throw new Error(
      'APP_ENV must contain lowercase letters, numbers, or dashes',
    )
  }

  return {
    betterAuthUrl: origin(environment.BETTER_AUTH_URL, 'BETTER_AUTH_URL'),
    webOrigin: origin(environment.WEB_ORIGIN, 'WEB_ORIGIN'),
    redisKeyPrefix: `zebabu:${applicationEnvironment}:better-auth`,
  }
}

export type { IdentityEnvironment }
