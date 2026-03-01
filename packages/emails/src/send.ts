import { render } from '@react-email/render'
import type { ReactElement } from 'react'
import { getResendClient } from './client'

type SendEmailOptions = {
  to: string
  subject: string
  template: ReactElement
  from: string
  apiKey: string
}

export async function sendEmail({
  to,
  subject,
  template,
  from,
  apiKey,
}: SendEmailOptions) {
  const html = await render(template)
  const resend = getResendClient(apiKey)

  return resend.emails.send({
    from,
    to,
    subject,
    html,
  })
}
