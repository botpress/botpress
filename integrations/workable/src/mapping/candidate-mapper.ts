import { z } from '@botpress/sdk'
import {
  candidateSchema,
  // detailedCandidateSchema,
  educationEntrySchema,
  experienceEntrySchema,
  getCandidateInputSchema,
  getCandidateOutputSchema,
  listCandidatesInputSchema,
  listCandidatesOutputSchema,
  locationSchema,
} from 'src/workable-schemas/candidates'
import {
  candidateModel,
  // detailedCandidateModel,
  educationEntryModel,
  experienceEntryModel,
  getCandidateInputModel,
  getCandidateOutputModel,
  listCandidatesInputModel,
  listCandidatesOutputModel,
  locationModel,
} from 'definitions/models/candidates'
import { parseNextToken } from './pagination'

export function fromListCandidatesInputModel(
  model: z.infer<typeof listCandidatesInputModel>
): z.infer<typeof listCandidatesInputSchema> {
  const { createdAfter, nextToken, shortCode, updatedAfter, ...rest } = model
  const abc = {
    ...rest,
    short_code: shortCode,
    since_id: nextToken,
    created_after: createdAfter,
    updated_after: updatedAfter,
  }
  return abc
}

export function toListCandidatesOutputModel(
  schema: z.infer<typeof listCandidatesOutputSchema>
): z.infer<typeof listCandidatesOutputModel> {
  return {
    nextToken: schema.paging?.next === undefined ? undefined : parseNextToken(schema.paging?.next),
    candidates: schema.candidates?.map(toCandidateModel),
  }
}

export function toCandidateModel(schema: z.infer<typeof candidateSchema>): z.infer<typeof candidateModel> {
  const {
    firstname,
    lastname,
    job,
    stage_kind,
    disqualification_reason,
    profile_url,
    created_at,
    updated_at,
    hired_at,
    ...rest
  } = schema

  return {
    ...rest,
    firstName: firstname,
    lastName: lastname,
    job: {
      title: job?.title,
      shortCode: job?.shortcode,
    },
    stageKind: stage_kind,
    disqualificationReason: disqualification_reason,
    profileUrl: profile_url,
    createdAt: created_at,
    updatedAt: updated_at,
    hiredAt: hired_at,
  }
}

export function fromGetCandidateInputModel(
  model: z.infer<typeof getCandidateInputModel>
): z.infer<typeof getCandidateInputSchema> {
  return model
}

// export function toDetailedCandidateModel(
//   schema: z.infer<typeof detailedCandidateSchema>
// ): z.infer<typeof detailedCandidateModel> {
//   return {
//     ...schema,
//     firstName: schema.firstname,
//     lastName: schema.lastname,
//     job: {
//       ...schema.job,
//       shortCode: schema.job?.shortcode,
//     },
//     stageKind: schema.stage_kind,
//     disqualificationReason: schema.disqualification_reason,
//     profileUrl: schema.profile_url,
//     createdAt: schema.created_at,
//     updatedAt: schema.updated_at,
//     hiredAt: schema.hired_at,
//     imageUrl: schema.image_url,
//     disqualifiedAt: schema.disqualified_at,
//     outboundMailbox: schema.outbound_mailbox,
//     uploaderId: schema.uploader_id,
//     coverLetter: schema.cover_letter,
//     educationEntries: schema.education_entries?.map(toEducationEntryModel),
//     experienceEntries: schema.experience_entries?.map(toExperienceEntryModel),
//     resumeUrl: schema.resume_url,
//     socialProfiles: schema.social_profiles,
//     location: {
//       ...schema.location,
//       locationString: schema.location?.location_str,
//       countryCode: schema.location?.country_code,
//       regionCode: schema.location?.region_code,
//       zipCode: schema.location?.zip_code,
//     },
//     originatingCandidateId: schema.originating_candidate_id,
//   }
// }

export function toEducationEntryModel(
  schema: z.infer<typeof educationEntrySchema>
): z.infer<typeof educationEntryModel> {
  return {
    ...schema,
    fieldOfStudy: schema.field_of_study,
    startDate: schema.start_date,
    endDate: schema.end_date,
  }
}

export function toExperienceEntryModel(
  schema: z.infer<typeof experienceEntrySchema>
): z.infer<typeof experienceEntryModel> {
  return {
    ...schema,
    startDate: schema.start_date,
    endDate: schema.end_date,
  }
}

export function toLocationModel(schema: z.infer<typeof locationSchema>): z.infer<typeof locationModel> {
  return {
    ...schema,
    locationString: schema.location_str,
    countryCode: schema.country_code,
    regionCode: schema.region_code,
    zipCode: schema.zip_code,
  }
}

export function getCandidateOutputDTOToModel(
  schema: z.infer<typeof getCandidateOutputSchema>
): z.infer<typeof getCandidateOutputModel> {
  return {
    candidate: schema.candidate,
  }
}
