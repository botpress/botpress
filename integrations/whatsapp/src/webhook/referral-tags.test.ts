import { describe, expect, test, vi } from 'vitest'
import { getReferralTags } from '../misc/referral-tags'
import { WhatsAppMessageSchema } from '../misc/types'

const referral = {
  source_url: 'https://example.com/ad',
  source_id: 'ad-id',
  source_type: 'ad',
  headline: 'Lease this car',
  body: 'A description of the advertised car',
  media_type: 'image',
  image_url: 'https://example.com/image.jpg',
  video_url: 'https://example.com/video.mp4',
  thumbnail_url: 'https://example.com/thumbnail.jpg',
  ctwa_clid: 'click-id',
}

const message = {
  from: '15555555555',
  id: 'wamid.ID',
  timestamp: '1753728000',
  type: 'text' as const,
  text: { body: 'Hello' },
  referral,
}

describe('WhatsApp referral tags', () => {
  test('preserves and maps all referral fields', () => {
    const parsedMessage = WhatsAppMessageSchema.parse(message)
    const logger = { forBot: () => ({ warn: vi.fn() }) } as any

    expect(parsedMessage.referral).toEqual(referral)
    expect(getReferralTags(parsedMessage, logger)).toEqual({
      referralSourceUrl: referral.source_url,
      referralSourceId: referral.source_id,
      referralSourceType: referral.source_type,
      referralHeadline: referral.headline,
      referralBody: referral.body,
      referralMediaType: referral.media_type,
      referralImageUrl: referral.image_url,
      referralVideoUrl: referral.video_url,
      referralThumbnailUrl: referral.thumbnail_url,
      referralCtwaClid: referral.ctwa_clid,
    })
  })

  test('truncates referral values that exceed the tag limit', () => {
    const parsedMessage = WhatsAppMessageSchema.parse({
      ...message,
      referral: { body: 'a'.repeat(501) },
    })
    const warn = vi.fn()
    const logger = { forBot: () => ({ warn }) } as any

    expect(getReferralTags(parsedMessage, logger)).toEqual({
      referralBody: 'a'.repeat(500),
    })
    expect(warn).toHaveBeenCalledOnce()
  })
})
