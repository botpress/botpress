import { z } from '@botpress/sdk'

const HttpMethodSchema = z.union([
  z.literal('GET'),
  z.literal('POST'),
  z.literal('PUT'),
  z.literal('PATCH'),
  z.literal('DELETE'),
  z.literal('OPTIONS'),
  z.literal('HEAD'),
])

const linkSchema = z.object({
  rel: z.string().optional(),
  href: z.string().optional(),
  method: HttpMethodSchema.optional(),
  targetSchema: z.string().optional(),
  schema: z.string().optional(),
})

const tagsSchema = z.object({
  id: z.number().optional(),
  name: z.string().optional(),
})

const memberLastNoteSchema = z.object({
  note_id: z.number().optional(),
  created_at: z.string().optional(),
  created_by: z.string().optional(),
  note: z.string().optional(),
})

const memberMarketingPermissionsInputSchema = z.object({
  marketing_permission_id: z.string().optional(),
  enabled: z.boolean().optional(),
})

const memberMarketingPermissionsSchema = memberMarketingPermissionsInputSchema.extend({
  text: z.string().optional(),
})

const memberLocationSchema = z.object({
  latitude: z.number(),
  longitude: z.number(),
})

const fullMemberLocationSchema = memberLocationSchema.extend({
  gmtoff: z.number().optional(),
  dstoff: z.number().optional(),
  country_code: z.string().optional(),
  timezone: z.string().optional(),
  region: z.string().optional(),
})

const memberEcommerceDataSchema = z.object({
  total_revenue: z.number().optional(),
  number_of_orders: z.number().optional(),
  currency_code: z.number().optional(),
})

const memberStatsSchema = z.object({
  avg_open_rate: z.number().optional(),
  avg_click_rate: z.number().optional(),
  ecommerce_data: memberEcommerceDataSchema.optional(),
})

const batchStatusSchema = z.union([
  z.literal('pending'),
  z.literal('preprocessing'),
  z.literal('started'),
  z.literal('finalizing'),
  z.literal('finished'),
])

const contactSchema = z.object({
  company: z.string().describe('Company name'),
  address1: z.string().describe('Address line 1'),
  address2: z.string().describe('Address line 2'),
  city: z.string().describe('City'),
  state: z.string().describe('State'),
  zip: z.string().describe('ZIP code'),
  country: z.string().describe('Country'),
  phone: z.string().describe('Phone number'),
})

const campaignDefaultsSchema = z.object({
  from_name: z.string().describe('Default sender name'),
  from_email: z.string().email().describe('Default sender email'),
  subject: z.string().describe('Default email subject'),
  language: z.string().describe('Default email language'),
})

const statsSchema = z.object({
  member_count: z.number().describe('Member count'),
  unsubscribe_count: z.number().describe('Unsubscribe count'),
  cleaned_count: z.number().describe('Cleaned count'),
  member_count_since_send: z.number().describe('Member count since last send'),
  unsubscribe_count_since_send: z.number().describe('Unsubscribe count since last send'),
  cleaned_count_since_send: z.number().describe('Cleaned count since last send'),
  campaign_count: z.number().describe('Campaign count'),
  campaign_last_sent: z.string().describe('Last campaign sent date'),
  merge_field_count: z.number().describe('Merge field count'),
  avg_sub_rate: z.number().describe('Average subscription rate'),
  avg_unsub_rate: z.number().describe('Average unsubscribe rate'),
  target_sub_rate: z.number().describe('Target subscription rate'),
  open_rate: z.number().describe('Open rate'),
  click_rate: z.number().describe('Click rate'),
  last_sub_date: z.string().describe('Last subscription date'),
  last_unsub_date: z.string().describe('Last unsubscribe date'),
})

const listSchema = z.object({
  id: z.string(),
  web_id: z.number(),
  name: z.string(),
  contact: contactSchema,
  permission_reminder: z.string(),
  use_archive_bar: z.boolean(),
  campaign_defaults: campaignDefaultsSchema,
  notify_on_subscribe: z.string(),
  notify_on_unsubscribe: z.string(),
  date_created: z.string(),
  list_rating: z.number(),
  email_type_option: z.boolean(),
  subscribe_url_short: z.string(),
  subscribe_url_long: z.string(),
  beamer_address: z.string(),
  visibility: z.string(),
  double_optin: z.boolean(),
  has_welcome: z.boolean(),
  marketing_permissions: z.boolean(),
  modules: z.array(z.any()),
  stats: statsSchema,
  _links: z.array(linkSchema),
})

const constraintsSchema = z.object({
  may_create: z.boolean().describe('May create flag'),
  max_instances: z.number().describe('Maximum instances allowed'),
  current_total_instances: z.number().describe('Current total instances'),
})

const recipientsSchema = z
  .object({
    list_id: z.string().describe('ID of the list'),
    list_is_active: z.boolean().describe('Indicates whether the list is active'),
    list_name: z.string().describe('Name of the list'),
    segment_text: z.string().describe('Text description of the segment'),
    recipient_count: z.number().describe('Count of recipients'),
    segment_opts: z
      .object({
        saved_segment_id: z.number().describe('ID of the saved segment'),
        prebuilt_segment_id: z.string().describe('ID of the prebuilt segment'),
        match: z.string().describe('Match condition'),
        conditions: z.array(z.unknown()).describe('Array of conditions'), // Adjust the type accordingly
      })
      .partial(),
  })
  .passthrough()
  .describe('Recipients information')

const settingsSchema = z
  .object({
    subject_line: z.string().describe('Subject line of the campaign'),
    preview_text: z.string().describe('Preview text of the campaign'),
    title: z.string().describe('Title of the campaign'),
    from_name: z.string().describe("Sender's name"),
    reply_to: z.string().describe('Reply-to email address'),
    use_conversation: z.boolean().describe('Indicates whether to use conversation view'),
    to_name: z.string().describe("Recipient's name"),
    folder_id: z.string().describe('ID of the folder'),
    authenticate: z.boolean().describe('Indicates whether authentication is enabled'),
    auto_footer: z.boolean().describe('Indicates whether auto-footer is enabled'),
    inline_css: z.boolean().describe('Indicates whether inline CSS is enabled'),
    auto_tweet: z.boolean().describe('Indicates whether auto-tweet is enabled'),
    auto_fb_post: z.array(z.string()).optional().describe('Array of Facebook post strings'),
    fb_comments: z.boolean().describe('Indicates whether Facebook comments are enabled'),
    timewarp: z.boolean().describe('Indicates whether timewarp is enabled'),
    template_id: z.number().describe('ID of the template'),
    drag_and_drop: z.boolean().describe('Indicates whether drag-and-drop is enabled'),
  })
  .passthrough()
  .describe('Settings for the campaign')

const variateSettingsSchema = z
  .object({
    winning_combination_id: z.string().describe('ID of the winning combination'),
    winning_campaign_id: z.string().describe('ID of the winning campaign'),
    winner_criteria: z.string().describe('Criteria for choosing the winner'),
    wait_time: z.number().describe('Wait time'),
    test_size: z.number().describe('Size of the test'),
    subject_lines: z.array(z.string()).describe('Array of subject lines'),
    send_times: z.array(z.string()).describe('Array of send times'),
    from_names: z.array(z.string()).describe('Array of sender names'),
    reply_to_addresses: z.array(z.string()).describe('Array of reply-to email addresses'),
    contents: z.array(z.string()).describe('Array of content strings'),
    combinations: z
      .array(
        z.object({
          id: z.string().describe('ID of the combination'),
          subject_line: z.number().describe('Subject line'),
          send_time: z.number().describe('Send time'),
          from_name: z.number().describe("Sender's name"),
          reply_to: z.number().describe('Reply-to'),
          content_description: z.number().describe('Content description'),
          recipients: z.number().describe('Recipients'),
        })
      )
      .describe('Array of combinations'),
  })
  .passthrough()

const trackingSchema = z
  .object({
    opens: z.boolean().describe('Indicates whether opens tracking is enabled'),
    html_clicks: z.boolean().describe('Indicates whether HTML clicks tracking is enabled'),
    text_clicks: z.boolean().describe('Indicates whether text clicks tracking is enabled'),
    goal_tracking: z.boolean().describe('Indicates whether goal tracking is enabled'),
    ecomm360: z.boolean().describe('Indicates whether Ecomm360 is enabled'),
    google_analytics: z.string().describe('Google Analytics tracking code'),
    clicktale: z.string().describe('Clicktale tracking code'),
    salesforce: z
      .object({
        campaign: z.boolean().describe('Indicates whether Salesforce campaign tracking is enabled'),
        notes: z.boolean().describe('Indicates whether Salesforce notes tracking is enabled'),
      })
      .optional()
      .describe('Salesforce tracking options'),
    capsule: z
      .object({
        notes: z.boolean().describe('Indicates whether Capsule notes tracking is enabled'),
      })
      .optional()
      .describe('Capsule tracking options'),
  })
  .passthrough()

const rssOptsSchema = z
  .object({
    feed_url: z.string().describe('URL of the RSS feed'),
    frequency: z.string().describe('Frequency of sending (e.g., "daily")'),
    schedule: z.object({
      hour: z.number().describe('Hour of the day for sending'),
      daily_send: z
        .object({
          sunday: z.boolean(),
          monday: z.boolean(),
          tuesday: z.boolean(),
          wednesday: z.boolean(),
          thursday: z.boolean(),
          friday: z.boolean(),
          saturday: z.boolean(),
        })
        .describe('Daily send options'),
      weekly_send_day: z.string().describe('Day of the week for weekly sending'),
      monthly_send_date: z.number().describe('Date of the month for monthly sending'),
    }),
    last_sent: z.string().describe('Last time the RSS feed was sent'),
    constrain_rss_img: z.boolean().describe('Indicates whether to constrain RSS images'),
  })
  .passthrough()

const abSplitOptsSchema = z
  .object({
    split_test: z.string().describe('Type of split test (e.g., "subject")'),
    pick_winner: z.string().describe('Criteria for picking the winner'),
    wait_units: z.string().describe('Units for waiting (e.g., "hours")'),
    wait_time: z.number().describe('Wait time'),
    split_size: z.number().describe('Size of the split'),
    from_name_a: z.string().describe("Sender's name for variation A"),
    from_name_b: z.string().describe("Sender's name for variation B"),
    reply_email_a: z.string().describe('Reply-to email address for variation A'),
    reply_email_b: z.string().describe('Reply-to email address for variation B'),
    subject_a: z.string().describe('Subject line for variation A'),
    subject_b: z.string().describe('Subject line for variation B'),
    send_time_a: z.string().describe('Send time for variation A'),
    send_time_b: z.string().describe('Send time for variation B'),
    send_time_winner: z.string().describe('Send time for the winner'),
  })
  .passthrough()

const socialCardSchema = z.object({
  image_url: z.string().describe('URL of the social card image'),
  description: z.string().describe('Description of the social card'),
  title: z.string().describe('Title of the social card'),
})

const reportSummarySchema = z
  .object({
    opens: z.number().describe('Total opens'),
    unique_opens: z.number().describe('Unique opens'),
    open_rate: z.number().describe('Open rate'),
    clicks: z.number().describe('Total clicks'),
    subscriber_clicks: z.number().describe('Subscriber clicks'),
    click_rate: z.number().describe('Click rate'),
    ecommerce: z.object({
      total_orders: z.number().describe('Total ecommerce orders'),
      total_spent: z.number().describe('Total amount spent in ecommerce'),
      total_revenue: z.number().describe('Total ecommerce revenue'),
    }),
  })
  .passthrough()

const deliveryStatusSchema = z.union([
  z.object({
    enabled: z.literal(true).describe('Indicates whether delivery status tracking is enabled'),
    can_cancel: z.boolean().describe('Indicates whether the campaign can be canceled'),
    status: z.string().describe('Current delivery status'),
    emails_sent: z.number().describe('Total emails sent'),
    emails_canceled: z.number().describe('Total emails canceled'),
  }),
  z.object({ enabled: z.literal(false) }),
])

export {
  HttpMethodSchema,
  linkSchema,
  tagsSchema,
  memberLastNoteSchema,
  memberMarketingPermissionsInputSchema,
  memberMarketingPermissionsSchema,
  memberLocationSchema,
  fullMemberLocationSchema,
  memberEcommerceDataSchema,
  memberStatsSchema,
  batchStatusSchema,
  constraintsSchema,
  abSplitOptsSchema,
  rssOptsSchema,
  campaignDefaultsSchema,
  contactSchema,
  deliveryStatusSchema,
  recipientsSchema,
  settingsSchema,
  reportSummarySchema,
  socialCardSchema,
  statsSchema,
  trackingSchema,
  variateSettingsSchema,
  listSchema,
}
