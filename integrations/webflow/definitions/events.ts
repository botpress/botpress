import { IntegrationDefinitionProps, z } from '@botpress/sdk'

export type WebflowEvent = {
  triggerType: string
  payload: unknown
}

export const itemSchema = z.object({
  id: z.string(),
  workspaceId: z.string(),
  siteId: z.string(),
  collectionId: z.string(),
  fieldData: z.object({
    name: z.string(),
    slug: z.string(),
  }),
  lastPublished: z.string().nullable(),
  lastUpdated: z.string(),
  createdOn: z.string(),
  isArchived: z.boolean(),
  isDraft: z.boolean(),
  cmsLocaleId: z.string().optional(),
})

export const userSchema = z.object({
  id: z.string(),
  isEmailVerified: z.boolean(),
  lastUpdated: z.string(),
  createdOn: z.string(),
  accessGroups: z.array(z.object({ slug: z.string(), type: z.string() })),
  data: z.object({
    'accept-communications': z.boolean(),
    email: z.string(),
    name: z.string(),
    'accept-privacy': z.string(),
  }),
})

export const pageSchema = z.object({
  siteId: z.string(),
  pageId: z.string(),
  pageTitle: z.string(),
  createdOn: z.string().optional(),
  lastUpdated: z.string().optional(),
  deletedOn: z.string().optional(),
  publishedPath: z.string(),
})

export const siteSchema = z.object({
  domain: z.array(z.string()),
  site: z.string(),
  publishedOn: z.string(),
  publishedBy: z.object({
    displayName: z.string(),
  }),
})

export const formSchema = z.object({
  name: z.string(),
  siteId: z.string(),
  data: z.object({
    'First Name': z.string(),
    'Last Name': z.string(),
    email: z.string(),
    'Phone Number': z.number(),
  }),
  schema: z.array(
    z.object({
      fieldName: z.string(),
      fieldType: z.string(),
      fieldElementId: z.string(),
    })
  ),
  submittedAt: z.string(),
  id: z.string(),
  formId: z.string(),
  formElementId: z.string(),
})

export const commentSchema = z.object({
  threadId: z.string(),
  commentId: z.string(),
  type: z.string(),
  siteId: z.string(),
  pageId: z.string(),
  localeId: z.string(),
  breakpoint: z.string(),
  url: z.string(),
  content: z.string(),
  isResolved: z.boolean(),
  author: z.object({
    userId: z.string(),
    email: z.string(),
    name: z.string(),
  }),
  mentionedUsers: z.array(
    z.object({
      userId: z.string(),
      email: z.string(),
      name: z.string(),
    })
  ),
  createdOn: z.string(),
  lastUpdated: z.string(),
})

export const ecommOrderSchema = z.object({
  orderId: z.string(),
  status: z.string(),
  comment: z.string(),
  orderComment: z.string(),
  acceptedOn: z.string(),
  fulfilledOn: z.string().nullable(),
  refundedOn: z.string().nullable(),
  disputedOn: z.string().nullable(),
  disputeUpdatedOn: z.string().nullable(),
  disputeLastStatus: z.string().nullable(),
  customerPaid: z.object({
    unit: z.string(),
    value: z.string(),
    string: z.string(),
  }),
  netAmount: z.object({
    unit: z.string(),
    value: z.string(),
    string: z.string(),
  }),
  applicationFee: z.object({
    unit: z.string(),
    value: z.string(),
    string: z.string(),
  }),
  allAddresses: z.array(
    z.object({
      type: z.string(),
      addressee: z.string(),
      line1: z.string(),
      line2: z.string(),
      city: z.string(),
      state: z.string(),
      country: z.string(),
      postalCode: z.string(),
    })
  ),
  shippingAddress: z.object({
    type: z.string(),
    japanType: z.string(),
    addressee: z.string(),
    line1: z.string(),
    line2: z.string(),
    city: z.string(),
    state: z.string(),
    country: z.string(),
    postalCode: z.string(),
  }),
  billingAddress: z.object({
    type: z.string(),
    addressee: z.string(),
    line1: z.string(),
    line2: z.string(),
    city: z.string(),
    state: z.string(),
    country: z.string(),
    postalCode: z.string(),
  }),
  shippingProvider: z.string(),
  shippingTracking: z.string(),
  shippingTrackingURL: z.string(),
  customerInfo: z.object({
    fullName: z.string(),
    email: z.string(),
  }),
  purchasedItems: z.array(
    z.object({
      count: z.number(),
      rowTotal: z.object({
        unit: z.string(),
        value: z.string(),
        string: z.string(),
      }),
      productId: z.string(),
      productName: z.string(),
      productSlug: z.string(),
      variantId: z.string(),
      variantName: z.string(),
      variantSlug: z.string(),
      variantSKU: z.string(),
      variantImage: z.object({
        url: z.string(),
        file: z.object({}), // TODO check how to do that
      }),
      variantPrice: z.object({
        unit: z.string(),
        value: z.string(),
        string: z.string(),
      }),
      weight: z.number(),
      width: z.number(),
      height: z.number(),
      length: z.number(),
    })
  ),
  purchasedItemsCount: z.number(),
  stripeDetails: z.object({
    subscriptionId: z.string().nullable(),
    paymentMethod: z.string(),
    paymentIntentId: z.string(),
    customerId: z.string(),
    chargeId: z.string(),
    disputeId: z.string(),
    refundId: z.string(),
    refundReason: z.string(),
  }),
  stripeCard: z.object({
    last4: z.string(),
    brand: z.string(),
    ownerName: z.string(),
    expires: z.object({
      year: z.number(),
      month: z.number(),
    }),
  }),
  paypalDetails: z.object({}),
  customData: z.array(z.object({})),
  metadata: z.object({
    isBuyNow: z.boolean(),
    hasDownloads: z.boolean(),
    paymentProcessor: z.string(),
  }),
  isCustomerDeleted: z.boolean(),
  isShippingRequired: z.boolean(),
  totals: z.object({
    subtotal: z.object({
      unit: z.string(),
      value: z.string(),
      string: z.string(),
    }),
    extras: z.array(
      z.object({
        type: z.string(),
        name: z.string(),
        description: z.string(),
        price: z.object({
          unit: z.string(),
          value: z.string(),
          string: z.string(),
        }),
      })
    ),
    total: z.object({
      unit: z.string(),
      value: z.string(),
      string: z.string(),
    }),
  }),
  downloadFiles: z.array(
    z.object({
      id: z.string(),
      name: z.string(),
      url: z.string(),
    })
  ),
})

export const ecommInventorySchema = z.object({
  id: z.string(),
  quantity: z.number(),
  inventoryType: z.enum(['finite', 'infinite']),
})

export const events = {
  collectionItemCreated: {
    title: 'Collection Item Created',
    description: 'Information about a new collection item',
    schema: itemSchema,
  },
  collectionItemDeleted: {
    title: 'Collection Item Deleted',
    description: 'Information about a deleted collection item',
    schema: itemSchema,
  },
  collectionItemUpdated: {
    title: 'Collection Item Updated',
    description: 'Information about an updated collection item',
    schema: itemSchema,
  },
  collectionItemPublished: {
    title: 'Collection Item Published',
    description: '',
    schema: itemSchema,
  },
  collectionItemUnpublished: {
    title: 'Collection Item Unpublished',
    description: '',
    schema: itemSchema,
  },
  userAccountAdded: {
    title: '',
    description: '',
    schema: userSchema,
  },
  userAccountUpdated: {
    title: '',
    description: '',
    schema: userSchema,
  },
  userAccountDeleted: {
    title: '',
    description: '',
    schema: userSchema,
  },
  pageCreated: {
    title: '',
    description: '',
    schema: pageSchema,
  },
  pageMetadataUpdated: {
    title: '',
    description: '',
    schema: pageSchema,
  },
  pageDeleted: {
    title: '',
    description: '',
    schema: pageSchema,
  },
  sitePublish: {
    title: '',
    description: '',
    schema: siteSchema,
  },
  formSubmission: {
    title: '',
    description: '',
    schema: formSchema,
  },
  commentCreated: {
    title: '',
    description: '',
    schema: commentSchema,
  },
  ecommNewOrder: {
    title: '',
    description: '',
    schema: ecommOrderSchema,
  },
  ecommOrderUpdated: {
    title: '',
    description: '',
    schema: ecommOrderSchema,
  },
  ecommInventoryUpdated: {
    title: '',
    description: '',
    schema: ecommInventorySchema,
  },
} satisfies IntegrationDefinitionProps['events']
