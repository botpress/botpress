import { z } from '@botpress/sdk'
import { imageSource, socialProfileTypesSchema } from 'definitions/models/candidates'
import { answerSchema, postAnswerSchema } from './answers'

export const baseCandidateSchema = z
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

export const candidateSchema = baseCandidateSchema.extend({
  job: z
    .object({
      shortcode: z.string(),
      title: z.string(),
    })
    .partial(),
})

export const listCandidatesOutputSchema = z.object({
  candidates: z.array(candidateSchema),
  paging: z.object({ next: z.string() }).partial().optional(),
})

export const listCandidatesInputSchema = z
  .object({
    email: z.string().nullable(),
    shortcode: z.string(),
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

export const updateEducationEntrySchema = z.object({
  id: z.string().optional(),
  degree: z.string().optional(),
  school: z.string(),
  field_of_study: z.string().optional(),
  start_date: z.string().optional(),
  end_date: z.string().optional(),
})

export const updateSocialProfileSchema = z.object({
  type: z.string(),
  name: z.string().optional(),
  username: z.string().optional(),
  url: z.string(),
})

export const updateExperienceEntrySchema = z.object({
  id: z.string().optional(),
  title: z.string(),
  summary: z.string().optional(),
  start_date: z.string().optional(),
  end_date: z.string().optional(),
  company: z.string().optional(),
  industry: z.string().optional(),
  current: z.boolean().optional(),
})

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

const detailedCandidateSchemaExtraFields = {
  image_url: z.string().nullable(),
  disqualified_at: z.string().nullable(),
  outbound_mailbox: z.string().nullable(),
  uploader_id: z.string().nullable(),
  cover_letter: z.string().nullable(),
  summary: z.string().nullable(),
  education_entries: z.array(educationEntrySchema),
  experience_entries: z.array(experienceEntrySchema),
  skills: z.array(z.object({ name: z.string() }).partial()),
  answers: z.array(answerSchema),
  resume_url: z.string().nullable(),
  social_profiles: z.array(socialProfileSchema),
  tags: z.array(z.string()),
  location: locationSchema.nullable(),
  originating_candidate_id: z.string().nullable(),
}

export const baseDetailedCandidateSchema = baseCandidateSchema.extend(detailedCandidateSchemaExtraFields).partial()

export const detailedCandidateSchema = candidateSchema.extend(detailedCandidateSchemaExtraFields).partial()

export const getCandidateOutputSchema = z
  .object({
    candidate: detailedCandidateSchema,
  })
  .partial()

export const getCandidateInputSchema = z.object({
  id: z.string(),
})

export const postEducationEntrySchema = z.object({
  degree: z.string().optional(),
  school: z.string(),
  field_of_study: z.string().optional(),
  start_date: z.string().optional(),
  end_date: z.string().optional(),
})

export const postSocialProfileSchema = z.object({
  type: socialProfileTypesSchema,
  username: z.string().optional(),
  url: z.string(),
})

export const postExperienceEntrySchema = z.object({
  title: z.string(),
  summary: z.string().optional(),
  start_date: z.string().optional(),
  end_date: z.string().optional(),
  company: z.string().optional(),
  current: z.boolean().optional(),
  industry: z.string().optional(),
})

export const postCandidateInTalentPoolSchema = z.object({
  firstname: z.string(),
  lastname: z.string(),
  email: z.string(),
  headline: z.string().optional(),
  summary: z.string().optional(),
  address: z.string().optional(),
  phone: z.string().optional(),
  cover_letter: z.string().optional(),
  education_entries: z.array(postEducationEntrySchema),
  experience_entries: z.array(postExperienceEntrySchema),
  skills: z.array(z.string()).optional(),
  tags: z.array(z.string()).optional(),
  disqualified: z.boolean().optional(),
  disqualification_reason: z.string().optional(),
  disqualified_at: z.string().optional(),
  social_profiles: z.array(postSocialProfileSchema),
  domain: z.string().optional(),
  recruiter_key: z.string().optional(),
  resume_url: z.string().optional(),
  resume: z
    .object({
      name: z.string(),
      data: z.string(),
    })
    .optional(),
})

export const postCandidateInJobSchema = postCandidateInTalentPoolSchema.extend({
  answers: z.array(postAnswerSchema).optional(),
})

export const postCandidateInTalentPoolInputSchema = z.object({
  sourced: z.boolean().optional(),
  candidate: postCandidateInTalentPoolSchema,
})

export const postCandidateInJobInputSchema = z.object({
  body: z.object({
    sourced: z.boolean().optional(),
    candidate: postCandidateInJobSchema,
  }),
  shortCode: z.string(),
})

export const postCandidateInTalentPoolOutputSchema = z.object({
  status: z.string(),
  candidate: baseDetailedCandidateSchema.extend({
    talent_pool: z.object({
      talent_pool_id: z.number(),
    }),
  }),
})

export const postCandidateInJobOutputSchema = z.object({
  status: z.string(),
  candidate: detailedCandidateSchema,
})

export const updateCandidateInputSchema = z.object({
  id: z.string(),
  body: z.object({
    candidate: postCandidateInTalentPoolSchema
      .extend({
        texting_consent: z.enum(['forced', 'declined']),
        image_url: z.string(),
        image_source: imageSource,
        image: z
          .object({
            name: z.string(),
            data: z.string(),
            source: imageSource,
          })
          .partial(),
        education_entries: z.array(updateEducationEntrySchema),
        experience_entries: z.array(updateExperienceEntrySchema),
        social_profiles: z.array(updateSocialProfileSchema),
      })
      .omit({
        disqualified: true,
        disqualification_reason: true,
        disqualified_at: true,
        domain: true,
        recruiter_key: true,
      })
      .partial(),
  }),
})
export const updateCandidateOutputSchema = z.object({
  candidate: detailedCandidateSchema,
})
