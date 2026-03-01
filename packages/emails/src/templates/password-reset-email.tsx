import { Link, Section, Text } from '@react-email/components'
import EmailLayout from './email-layout'

interface PasswordResetEmailProps {
  url: string
}

export default function PasswordResetEmail({ url }: PasswordResetEmailProps) {
  return (
    <EmailLayout preview="Reset your password" heading="Reset your password">
      <Text className="text-center text-base text-gray-600">
        Click the link below to reset your password. If you didn&apos;t request
        this, you can safely ignore this email.
      </Text>
      <Section className="my-6 text-center">
        <Link href={url} className="text-base font-semibold">
          Reset password
        </Link>
      </Section>
    </EmailLayout>
  )
}
