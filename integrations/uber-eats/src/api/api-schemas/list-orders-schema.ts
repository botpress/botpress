import { z } from '@botpress/sdk'

export const UberOrderStateEnum = z.enum(['OFFERED', 'ACCEPTED', 'HANDED_OFF', 'SUCCEEDED', 'FAILED', 'UNKNOWN'])

export const UberOrderStatusEnum = z.enum(['SCHEDULED', 'ACTIVE', 'COMPLETED', 'UNKNOWN'])

export const UberExpandField = z.enum(['carts', 'deliveries', 'payment'])
export const UberPaginationDataSchema = z.object({
  next_page_token: z
    .string()
    .optional()
    .describe('Token to retrieve the next page. Only returned if there is a next page.'),
  page_size: z.number().optional().describe('Number of orders in the response for this page'),
})

export const UberRestaurantOrderSchema = z.object({
  order: z
    .object({
      id: z.string().optional(),
      display_id: z.string().optional(),
      external_id: z.string().optional(),
      state: z.string().optional(),
      status: z.string().optional(),
    })
    .passthrough()
    .describe('Details of the order'),
})

export const listOrdersOutputSchema = z.object({
  data: z.array(UberRestaurantOrderSchema),
  pagination_data: UberPaginationDataSchema.optional(),
})

export const listOrdersInputSchema = z.object({
  store_id: z
    .string()
    .min(1)
    .describe('Uber store_id (restaurant identifier). This is the identifier expected in support queries.'),

  expand: z
    .array(UberExpandField)
    .optional()
    .describe(
      [
        'Fields to expand in the response.',
        'Expected values:',
        '- carts',
        '- deliveries',
        '- payment',
        "Example: ['carts','payment']",
      ].join('\n')
    ),

  state: z
    .array(UberOrderStateEnum)
    .optional()
    .describe(
      [
        'Filter orders by state(s).',
        '',
        'Values:',
        '- OFFERED: Order has been offered to the merchant',
        '- ACCEPTED: Merchant has accepted the order',
        '- HANDED_OFF: Order fully handed off to delivery partners',
        '- SUCCEEDED: Successfully delivered',
        '- FAILED: Failed for any reason',
        '- UNKNOWN: Catch-all for unrecognized states',
        '',
        "Example: ['OFFERED','ACCEPTED']",
      ].join('\n')
    ),

  status: z
    .array(UberOrderStatusEnum)
    .optional()
    .describe(
      [
        'Filter orders by status(es).',
        '',
        'Values:',
        '- SCHEDULED: Scheduled for a future time',
        '- ACTIVE: Order is active',
        '- COMPLETED: Order is completed',
        '- UNKNOWN: Catch-all for unrecognized statuses',
        '',
        "Example: ['SCHEDULED','ACTIVE']",
      ].join('\n')
    ),

  start_time: z
    .string()
    .optional()
    .describe(
      [
        'RFC3339 timestamp.',
        'Filters orders created after this time.',
        'Must be before end_time if specified.',
        'Only orders within the last 60 days are returned.',
        "Example: '2025-12-01T00:00:00Z'",
      ].join('\n')
    ),

  end_time: z
    .string()
    .optional()
    .describe(
      [
        'RFC3339 timestamp.',
        'Filters orders created before this time.',
        'Must be after start_time if specified.',
        'If start_time is omitted, Uber defaults it to 60 days ago.',
        "Example: '2025-12-12T23:59:59Z'",
      ].join('\n')
    ),

  next_page_token: z
    .string()
    .optional()
    .describe('Pagination token returned in pagination_data.next_page_token to fetch the next page.'),

  page_size: z
    .number()
    .int()
    .min(1)
    .max(50)
    .optional()
    .describe('Number of orders per page. Max 50. Defaults to 50 if omitted.'),
})
