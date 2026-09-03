import { profileSchema, type ProfilePreferences } from './preferences'

export async function updatePreferences(
  preferences: ProfilePreferences,
): Promise<boolean> {
  const parsed = profileSchema.safeParse(preferences)
  if (!parsed.success) return false

  try {
    const response = await fetch('/api/auth/update-user', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(parsed.data),
    })
    return response.ok
  } catch {
    return false
  }
}
