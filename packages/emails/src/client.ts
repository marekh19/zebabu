import { Resend } from 'resend'

let resend: Resend | undefined

export function getResendClient(apiKey: string): Resend {
  if (!resend) {
    resend = new Resend(apiKey)
  }
  return resend
}
