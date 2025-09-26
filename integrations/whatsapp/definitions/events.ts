import { z } from '@botpress/sdk'

export const qualityScoreSchema = z.enum(['GREEN', 'RED', 'YELLOW', 'UNKNOWN'])

export const WhatsAppMessageTemplateComponentsUpdateValueSchema = z.object({
  id: z.number(),
  name: z.string(),
  language: z.string(),
  element: z.string(),
  title: z.string().optional(),
  footer: z.string().optional(),
  buttons: z
    .array(
      z.object({
        button_type: z.enum([
          'CATALOG',
          'COPY_CODE',
          'EXTENSION',
          'FLOW',
          'MPM',
          'ORDER_DETAILS',
          'OTP',
          'PHONE_NUMBER',
          'POSTBACK',
          'REMINDER',
          'SEND_LOCATION',
          'SPM',
          'QUICK_REPLY',
          'URL',
          'VOICE_CALL',
        ]),
        button_text: z.string(),
        button_url: z.string().optional(),
        button_phone_number: z.string().optional(),
      })
    )
    .optional(),
})

export const WhatsAppMessageTemplateQualityUpdateValueSchema = z.object({
  previous_quality_score: qualityScoreSchema,
  new_quality_score: qualityScoreSchema,
  id: z.number(),
  name: z.string(),
  language: z.string(),
})

export const WhatsAppMessageTemplateStatusUpdateValueSchema = z.object({
  event: z.enum([
    'APPROVED',
    'ARCHIVED',
    'DELETED',
    'DISABLED',
    'FLAGGED',
    'IN_APPEAL',
    'LIMIT_EXCEEDED',
    'LOCKED',
    'PAUSED',
    'PENDING',
    'REINSTATED',
    'PENDING_DELETION',
    'REJECTED',
  ]),
  id: z.number(),
  name: z.string(),
  language: z.string(),
  reason: z
    .enum([
      'ABUSIVE_CONTENT',
      'CATEGORY_NOT_AVAILABLE',
      'INCORRECT_CATEGORY',
      'INVALID_FORMAT',
      'NONE',
      'PROMOTIONAL',
      'SCAM',
      'TAG_CONTENT_MISMATCH',
    ])
    .nullable(),
  disable_info: z.object({ disable_date: z.number() }).optional(),
  other_info: z
    .object({
      title: z.enum(['FIRST_PAUSE', 'SECOND_PAUSE', 'RATE_LIMITING_PAUSE', 'UNPAUSE', 'DISABLED']),
      description: z.string(),
    })
    .optional(),
})

export const WhatsAppTemplateCategoryUpdateValueSchema = z.object({
  id: z.number(),
  name: z.string(),
  language: z.string(),
  correct_category: z.string().optional(),
  previous_category: z.string().optional(),
  new_category: z.string().optional(),
})
