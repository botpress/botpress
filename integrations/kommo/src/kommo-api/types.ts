import { z } from '@botpress/sdk'

// -----LEADS------

// Zod schema for KommoLead
export const kommoLeadSchema = z.object({
  id: z.number(),
  name: z.string(),
  price: z.number(),
  responsible_user_id: z.number(),
  group_id: z.number(),
  status_id: z.number(),
  pipeline_id: z.number(),
  loss_reason_id: z.number().nullable(),
  created_by: z.number(),
  updated_by: z.number(),
  created_at: z.number(),
  updated_at: z.number(),
  closed_at: z.number().nullable(),
  closest_task_at: z.number().nullable(),
  is_deleted: z.boolean(),
  score: z.number().nullable(),
  account_id: z.number(),
  labor_cost: z.number().nullable(),
  is_price_computed: z.boolean(),
  custom_fields_values: z
    .array(
      z.object({
        field_id: z.number(),
        field_name: z.string(),
        field_code: z.string().nullable().optional(),
        field_type: z.string(),
        values: z.array(
          z.object({
            value: z.union([z.string(), z.number()]),
            enum_id: z.number().optional(),
          })
        ),
      })
    )
    .optional(),
  _embedded: z
    .object({
      tags: z
        .array(
          z.object({
            id: z.number(),
            name: z.string(),
          })
        )
        .optional(),
      companies: z
        .array(
          z.object({
            id: z.number(),
            _links: z.object({
              self: z.object({
                href: z.string(),
              }),
            }),
          })
        )
        .optional(),
      contacts: z
        .array(
          z.object({
            id: z.number(),
            is_main: z.boolean(),
            _links: z.object({
              self: z.object({
                href: z.string(),
              }),
            }),
          })
        )
        .optional(),
    })
    .optional(),
  _links: z
    .object({
      self: z.object({
        href: z.string(),
      }),
    })
    .optional(),
})

export type KommoLead = z.infer<typeof kommoLeadSchema>

// Zod schema for CreateLeadRequest
export const createLeadRequestSchema = z.object({
  name: z.string(),
  price: z.number().optional(),
  responsible_user_id: z.number().optional(),
  pipeline_id: z.number().optional(),
  status_id: z.number().optional(),
  created_by: z.number().optional(),
  updated_by: z.number().optional(),
  created_at: z.number().optional(),
  updated_at: z.number().optional(),
  closed_at: z.number().optional(),
  custom_fields_values: z
    .array(
      z.object({
        field_id: z.number(),
        values: z.array(
          z.object({
            value: z.union([z.string(), z.number()]),
          })
        ),
      })
    )
    .optional(),
  _embedded: z
    .object({
      tags: z
        .array(
          z.object({
            id: z.number().optional(),
            name: z.string().optional(),
          })
        )
        .optional(),
      contacts: z
        .array(
          z.object({
            id: z.number(),
            is_main: z.boolean().optional(),
          })
        )
        .optional(),
      companies: z
        .array(
          z.object({
            id: z.number(),
          })
        )
        .optional(),
    })
    .optional(),
})

export type CreateLeadRequest = z.infer<typeof createLeadRequestSchema>

// Zod schema for UpdateLeadRequest
export const updateLeadRequestSchema = z.object({
  id: z.number().optional(),
  name: z.string().optional(),
  price: z.number().optional(),
  responsible_user_id: z.number().optional(),
  status_id: z.number().optional(),
  pipeline_id: z.number().optional(),
  custom_fields_values: z
    .array(
      z.object({
        field_id: z.number(),
        values: z.array(
          z.object({
            value: z.union([z.string(), z.number()]),
          })
        ),
      })
    )
    .optional(),
})

export type UpdateLeadRequest = z.infer<typeof updateLeadRequestSchema>

// Zod schema for KommoCreateResponse
export const kommoCreateResponseSchema = z.object({
  _links: z.object({
    self: z.object({
      href: z.string(),
    }),
  }),
  _embedded: z.object({
    leads: z.array(
      z.object({
        id: z.number(),
        request_id: z.string(),
        _links: z.object({
          self: z.object({
            href: z.string(),
          }),
        }),
      })
    ),
  }),
})

export type KommoCreateResponse = z.infer<typeof kommoCreateResponseSchema>

// Zod schema for KommoUpdateResponse
export const kommoUpdateResponseSchema = z.object({
  _links: z.object({
    self: z.object({
      href: z.string(),
    }),
  }),
  _embedded: z.object({
    leads: z.array(kommoLeadSchema),
  }),
})

export type KommoUpdateResponse = z.infer<typeof kommoUpdateResponseSchema>

// Zod schema for KommoSearchLeadResponse
export const kommoSearchLeadResponseSchema = z.object({
  _page: z.number(),
  _links: z.object({
    self: z.object({
      href: z.string(),
    }),
  }),
  _embedded: z.object({
    leads: z.array(kommoLeadSchema),
  }),
})

export type KommoSearchLeadResponse = z.infer<typeof kommoSearchLeadResponseSchema>

// -------------CONTACTS-------------

// Zod schema for KommoContact
export const kommoContactSchema = z.object({
  id: z.number(),
  name: z.string(),
  first_name: z.string(),
  last_name: z.string(),
  responsible_user_id: z.number(),
  group_id: z.number(),
  updated_by: z.number(),
  created_at: z.number(),
  updated_at: z.number(),
  closest_task_at: z.number().nullable(),
  is_deleted: z.boolean(),
  account_id: z.number(),
})

export type KommoContact = z.infer<typeof kommoContactSchema>

// Zod schema for CreateContactRequest
export const createContactRequestSchema = z.object({
  name: z.string().optional(),
  first_name: z.string().optional(),
  last_name: z.string().optional(),
  responsible_user_id: z.number(),
  created_by: z.number(),
  updated_by: z.number().optional(),
})

export type CreateContactRequest = z.infer<typeof createContactRequestSchema>

// Zod schema for KommoCreateContactResponse
export const kommoCreateContactResponseSchema = z.object({
  _links: z.object({
    self: z.object({
      href: z.string(),
    }),
  }),
  _embedded: z.object({
    contacts: z.array(
      z.object({
        id: z.number(),
        request_id: z.string(),
        _links: z.object({
          self: z.object({
            href: z.string(),
          }),
        }),
      })
    ),
  }),
})

export type KommoCreateContactResponse = z.infer<typeof kommoCreateContactResponseSchema>

// Zod schema for KommoSearchContactsResponse
export const kommoSearchContactsResponseSchema = z.object({
  _page: z.number(),
  _links: z.object({
    self: z.object({
      href: z.string(),
    }),
    next: z
      .object({
        href: z.string(),
      })
      .optional(),
  }),
  _embedded: z.object({
    contacts: z.array(kommoContactSchema),
  }),
})

export type KommoSearchContactsResponse = z.infer<typeof kommoSearchContactsResponseSchema>

//----General-----
// Zod schema for KommoErrorResponse
export const kommoErrorResponseSchema = z.object({
  title: z.string(),
  type: z.string(),
  status: z.number(),
  detail: z.string(),
  validation_errors: z
    .array(
      z.object({
        request_id: z.string(),
        errors: z.array(
          z.object({
            code: z.string(),
            path: z.string(),
            detail: z.string(),
          })
        ),
      })
    )
    .optional(),
})

export type KommoErrorResponse = z.infer<typeof kommoErrorResponseSchema>
