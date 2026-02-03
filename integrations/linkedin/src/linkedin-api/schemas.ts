import { z } from '@botpress/sdk'

export const linkedInTokenResponseSchema = z
  .object({
    access_token: z.string(),
    expires_in: z.number(),
    refresh_token: z.string().optional(),
    refresh_token_expires_in: z.number().optional(),
    scope: z.string().optional(),
  })
  .passthrough()

export type LinkedInTokenResponse = z.infer<typeof linkedInTokenResponseSchema>

export const linkedInErrorResponseSchema = z
  .object({
    message: z.string().optional(),
    serviceErrorCode: z.number().optional(),
    status: z.number().optional(),
  })
  .passthrough()

export type LinkedInErrorResponse = z.infer<typeof linkedInErrorResponseSchema>

export const userInfoSchema = z
  .object({
    sub: z.string(),
    name: z.string().optional(),
    given_name: z.string().optional(),
    family_name: z.string().optional(),
    picture: z.string().optional(),
    email: z.string().optional(),
    email_verified: z.boolean().optional(),
  })
  .passthrough()

export type UserInfo = z.infer<typeof userInfoSchema>

export const initializeUploadResponseSchema = z
  .object({
    value: z
      .object({
        uploadUrl: z.string(),
        image: z.string(),
      })
      .passthrough(),
  })
  .passthrough()
