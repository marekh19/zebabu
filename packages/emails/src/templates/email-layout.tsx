import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Tailwind,
} from '@react-email/components'
import type { ReactNode } from 'react'

interface EmailLayoutProps {
  preview: string
  heading: string
  children: ReactNode
}

export default function EmailLayout({
  preview,
  heading,
  children,
}: EmailLayoutProps) {
  return (
    <Html>
      <Head />
      <Preview>{preview}</Preview>
      <Tailwind>
        <Body className="bg-gray-50 font-sans">
          <Container className="mx-auto max-w-md bg-white px-5 py-10">
            <Heading className="text-center text-2xl font-semibold">
              {heading}
            </Heading>
            {children}
          </Container>
        </Body>
      </Tailwind>
    </Html>
  )
}
