import { z } from '@botpress/sdk'

export const qualityScoreSchema = z.enum(['GREEN', 'RED', 'YELLOW', 'UNKNOWN'])

export const WhatsAppMessageTemplateComponentsUpdateValueSchema = z
  .object({
    id: z.number().describe('Template ID.').title('Template Id'),
    name: z.string().describe('Template name.').title('Template Name'),
    language: z.string().describe('Template language and locale code.').title('Template Language'),
    element: z.string().describe('Template body text.').title('Template Body Text'),
    title: z.string().optional().describe('Template Header Text.').title('Template Header Text'),
    footer: z.string().optional().describe('Template Footer Text.').title('Template Footer Text'),
    buttons: z
      .array(
        z.object({
          button_type: z
            .enum([
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
            ])
            .describe('Button type.')
            .title('Button Type'),
          button_text: z.string().describe('Button label text.').title('Button Label Text'),
          button_url: z.string().optional().describe('Button URL.').title('Button URL'),
          button_phone_number: z.string().optional().describe('Button phone number.').title('Button Phone Number'),
        })
      )
      .optional()
      .describe('Array of button objects, if present.'),
  })
  .title('Message Template Components Update')
  .describe("The message_template_components_update webhook notifies you of changes to a template's components.")

export const WhatsAppMessageTemplateQualityUpdateValueSchema = z
  .object({
    previous_quality_score: qualityScoreSchema
      .describe('Previous template quality score.')
      .title('Previous Quality Score'),
    new_quality_score: qualityScoreSchema.describe('New template quality score.').title('New Quality Score'),
    id: z.number().describe('Template ID.').title('Template Id'),
    name: z.string().describe('Template name.').title('Template Name'),
    language: z.string().describe('Template language and locale code.').title('Template Language'),
  })
  .title('Message Template Quality Update')
  .describe("The message_template_quality_update webhook notifies you of changes to a template's quality score.")

export const WhatsAppMessageTemplateStatusUpdateValueSchema = z
  .object({
    event: z
      .enum([
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
      ])
      .describe('Template status event.')
      .title('Template Status Event'),
    id: z.number().describe('Template ID.').title('Template Id'),
    name: z.string().describe('Template name.').title('Template Name'),
    language: z.string().describe('Language and locale code.').title('Template Language'),
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
      .nullable()
      .describe('Template rejection reason, if rejected.')
      .title('Rejection Reason'),
    disable_info: z
      .object({
        disable_date: z
          .number()
          .describe('Unix timestamp indicating when the template was disabled.')
          .title('Disable Timestamp'),
      })
      .optional()
      .describe('only included if template disabled'),
    other_info: z
      .object({
        title: z
          .enum(['FIRST_PAUSE', 'SECOND_PAUSE', 'RATE_LIMITING_PAUSE', 'UNPAUSE', 'DISABLED'])
          .describe('Title of template pause or unpause event.')
          .title('Title'),
        description: z
          .string()
          .describe('String describing why the template was locked or unlocked.')
          .title('Description'),
      })
      .optional()
      .describe('only included if template locked or unlocked'),
  })
  .title('Message Template Status Update')
  .describe('The message_template_status_update webhook notifies you of changes to the status of an existing template.')

export const WhatsAppTemplateCategoryUpdateValueSchema = z
  .object({
    id: z.number().describe('Template ID.').title('Template Id'),
    name: z.string().describe('Template name.').title('Template Name'),
    language: z.string().describe('Template language and locale code.').title('Template Language'),
    correct_category: z
      .string()
      .optional()
      .describe('The category that the template will be recategorized as in 24 hours.')
      .title('Correct Category'),
    previous_category: z.string().optional().describe("The template's previous category.").title('Previous Category'),
    new_category: z.string().optional().describe("The template's new category.").title('New Category'),
  })
  .title('Template Category Update')
  .describe("The template_category_update webhook notifies you of changes to template's category.")
