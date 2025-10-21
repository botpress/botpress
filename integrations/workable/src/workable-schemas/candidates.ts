import { z } from '@botpress/sdk'

export const candidateSchema = z
  .object({
    id: z.string(),
    name: z.string(),
    firstname: z.string(),
    lastname: z.string(),
    headline: z.string().nullable(),
    account: z
      .object({
        subdomain: z.string().nullable(),
        name: z.string().nullable(),
      })
      .partial(),
    job: z
      .object({
        shortcode: z.string(),
        title: z.string(),
      })
      .partial(),
    stage: z.string().nullable(),
    stage_kind: z.string().nullable(),
    disqualified: z.boolean(),
    withdrew: z.boolean(),
    disqualification_reason: z.string().nullable(),
    sourced: z.boolean(),
    profile_url: z.string().nullable(),
    email: z.string().nullable(),
    domain: z.string().nullable(),
    created_at: z.string(),
    updated_at: z.string(),
    hired_at: z.string().nullable(),
    address: z.string().nullable(),
    phone: z.string().nullable(),
  })
  .partial()

export const listCandidatesOutputSchema = z.object({
  candidates: z.array(candidateSchema),
  paging: z.object({ next: z.string() }).partial().optional(),
})

export const listCandidatesInputSchema = z
  .object({
    email: z.string().nullable(),
    short_code: z.string(),
    stage: z.string(),
    limit: z.number(),
    since_id: z.string(),
    created_after: z.string(),
    updated_after: z.string(),
  })
  .partial()

export const educationEntrySchema = z
  .object({
    id: z.string(),
    degree: z.string().nullable(),
    school: z.string(),
    field_of_study: z.string().nullable(),
    start_date: z.string().nullable(),
    end_date: z.string().nullable(),
  })
  .partial()

export const socialProfileSchema = z
  .object({
    type: z.string(),
    name: z.string().nullable(),
    username: z.string().nullable(),
    url: z.string(),
  })
  .partial()

export const experienceEntrySchema = z
  .object({
    id: z.string(),
    title: z.string(),
    summary: z.string().nullable(),
    start_date: z.string().nullable(),
    end_date: z.string().nullable(),
    company: z.string().nullable(),
    industry: z.string().nullable(),
    current: z.boolean().nullable(),
  })
  .partial()

export const locationSchema = z
  .object({
    location_str: z.string().nullable(),
    country: z.string().nullable(),
    country_code: z.string().nullable(),
    region: z.string().nullable(),
    region_code: z.string().nullable(),
    city: z.string().nullable(),
    zip_code: z.string().nullable(),
  })
  .partial()

export const detailedCandidateSchema = candidateSchema
  .extend({
    image_url: z.string().nullable(),
    disqualified_at: z.string().nullable(),
    outbound_mailbox: z.string().nullable(),
    uploader_id: z.string().nullable(),
    cover_letter: z.string().nullable(),
    summary: z.string().nullable(),
    education_entries: z.array(educationEntrySchema.optional()),
    experience_entries: z.array(experienceEntrySchema.optional()),
    skills: z.array(z.object({ name: z.string() }).partial().optional()),
    answers: z.array(z.string().optional()),
    resume_url: z.string().nullable(),
    social_profiles: z.array(socialProfileSchema.optional()),
    tags: z.array(z.string().optional()),
    location: locationSchema.nullable(),
    originating_candidate_id: z.string().nullable(),
  })
  .partial()

export const getCandidateOutputSchema = z
  .object({
    candidate: detailedCandidateSchema,
  })
  .partial()

export const getCandidateInputSchema = z.object({
  id: z.string(),
})
