import type { ParametersMap } from '@bpinternal/opapi'
import { z } from 'zod'

export const pagingParameters: ParametersMap = {
  nextToken: {
    in: 'query',
    description:
      'Provide the `meta.nextToken` value provided in the last API response to retrieve the next page of results',
    type: 'string',
    required: false,
  },
}

export const pagedResponseMeta = z.object({
  nextToken: z
    .string()
    .describe(
      'The token to use to retrieve the next page of results, passed as a query string parameter (value should be URL-encoded) to this API endpoint.'
    )
    .optional(),
})
