import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Link,
  Preview,
  Section,
  Tailwind,
  Text,
} from '@react-email/components'

interface VerificationEmailProps {
  url: string
}

// TODO: Resolve i18n for the email template
export default function VerificationEmail({ url }: VerificationEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>Verify your email address</Preview>
      <Tailwind>
        <Body className="bg-gray-50 font-sans">
          <Container className="mx-auto max-w-md bg-white px-5 py-10">
            <Heading className="text-center text-2xl font-semibold">
              Verify your email
            </Heading>
            <Text className="text-center text-base text-gray-600">
              Click the link below to verify your email address and activate
              your account.
            </Text>
            <Section className="my-6 text-center">
              <Link href={url} className="text-base font-semibold">
                Verify email
              </Link>
            </Section>
          </Container>
        </Body>
      </Tailwind>
    </Html>
  )
}
