import { describe, test, expect, vi, beforeEach } from 'vitest'
import { RuntimeError } from '@botpress/sdk'

vi.mock('nodemailer', () => ({
  default: {
    createTransport: vi.fn(),
  },
}))

import nodemailer from 'nodemailer'
import { sendNodemailerMail } from './smtp'

const makeConfig = (overrides: Record<string, string> = {}) => ({
  smtpHost: 'smtp.example.com',
  user: 'user@example.com',
  password: 'password123',
  ...overrides,
})

const makeProps = (overrides: Record<string, string> = {}) => ({
  to: 'recipient@example.com',
  subject: 'Test Subject',
  html: '<p>Hello</p>',
  ...overrides,
})

const makeLogger = () => ({
  forBot: () => ({
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  }),
})

describe('sendNodemailerMail', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  test('invalid SMTP host throws RuntimeError about transport creation', async () => {
    vi.mocked(nodemailer.createTransport).mockImplementation(() => {
      throw new Error('getaddrinfo ENOTFOUND invalid.host')
    })

    await expect(
      sendNodemailerMail(makeConfig() as any, makeProps() as any, makeLogger() as any)
    ).rejects.toThrow(RuntimeError)

    await expect(
      sendNodemailerMail(makeConfig() as any, makeProps() as any, makeLogger() as any)
    ).rejects.toThrow(/Failed to create SMTP transport:.*getaddrinfo ENOTFOUND/)
  })

  test('valid host but wrong credentials throws RuntimeError about sending', async () => {
    const mockSendMail = vi.fn().mockRejectedValue(new Error('Invalid login: 535 Authentication failed'))
    vi.mocked(nodemailer.createTransport).mockReturnValue({ sendMail: mockSendMail } as any)

    await expect(
      sendNodemailerMail(makeConfig() as any, makeProps() as any, makeLogger() as any)
    ).rejects.toThrow(RuntimeError)

    await expect(
      sendNodemailerMail(makeConfig() as any, makeProps() as any, makeLogger() as any)
    ).rejects.toThrow(/Failed to send email to 'recipient@example.com':.*Authentication failed/)
  })

  test('happy path sends email and logs success', async () => {
    const mockSendMail = vi.fn().mockResolvedValue({ messageId: '<abc@example.com>' })
    vi.mocked(nodemailer.createTransport).mockReturnValue({ sendMail: mockSendMail } as any)

    const logger = makeLogger()
    const result = await sendNodemailerMail(makeConfig() as any, makeProps() as any, logger as any)

    expect(result).toEqual({})
    expect(mockSendMail).toHaveBeenCalledWith({
      from: 'user@example.com',
      to: 'recipient@example.com',
      subject: 'Test Subject',
      html: '<p>Hello</p>',
      references: undefined,
    })
  })
})
