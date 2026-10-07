import type { WhatsAppMessage, WhatsAppReferral } from './types'
import * as bp from '.botpress'

const REFERRAL_TAGS = {
  source_url: 'referralSourceUrl',
  source_id: 'referralSourceId',
  source_type: 'referralSourceType',
  headline: 'referralHeadline',
  body: 'referralBody',
  media_type: 'referralMediaType',
  image_url: 'referralImageUrl',
  video_url: 'referralVideoUrl',
  thumbnail_url: 'referralThumbnailUrl',
  ctwa_clid: 'referralCtwaClid',
} satisfies Record<keyof WhatsAppReferral, string>

const MAX_TAG_VALUE_LENGTH = 500

export function getReferralTags(message: WhatsAppMessage, logger: bp.Logger): Record<string, string> {
  const { referral } = message
  if (!referral) {
    return {}
  }

  const tags: Record<string, string> = {}

  for (const referralField of Object.keys(REFERRAL_TAGS) as (keyof WhatsAppReferral)[]) {
    const originalValue = referral[referralField]
    if (!originalValue) {
      continue
    }

    const processedValue = originalValue.slice(0, MAX_TAG_VALUE_LENGTH)
    if (originalValue !== processedValue) {
      logger
        .forBot()
        .warn(
          `For whatsapp message "${message.id}", referral field "${referralField}" was truncated from ${originalValue.length} to ${MAX_TAG_VALUE_LENGTH} characters`
        )
    }

    tags[REFERRAL_TAGS[referralField]] = processedValue
  }

  return tags
}
