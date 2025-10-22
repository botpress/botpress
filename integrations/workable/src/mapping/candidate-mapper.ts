import { z } from '@botpress/sdk'
import * as def from 'definitions/models/candidates'
import * as workable from 'src/workable-schemas/candidates'
import { parseNextToken } from './pagination'

export function fromListCandidatesInputModel(
  model: z.infer<typeof def.listCandidatesInputSchema>
): z.infer<typeof workable.listCandidatesInputSchema> {
  const { createdAfter, nextToken, shortCode, updatedAfter, ...rest } = model
  return {
    ...rest,
    shortcode: shortCode,
    since_id: nextToken,
    created_after: createdAfter,
    updated_after: updatedAfter,
  }
}

export function toListCandidatesOutputModel(
  schema: z.infer<typeof workable.listCandidatesOutputSchema>
): z.infer<typeof def.listCandidatesOutputSchema> {
  return {
    nextToken: schema.paging?.next === undefined ? undefined : parseNextToken(schema.paging?.next),
    candidates: schema.candidates?.map(toCandidateModel),
  }
}

export function toCandidateModel(
  schema: z.infer<typeof workable.candidateSchema>
): z.infer<typeof def.candidateSchema> {
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
  model: z.infer<typeof def.getCandidateInputSchema>
): z.infer<typeof workable.getCandidateInputSchema> {
  return model
}

export function toDetailedCandidateModel(
  schema: z.infer<typeof workable.detailedCandidateSchema>
): z.infer<typeof def.detailedCandidateSchema> {
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
    image_url,
    disqualified_at,
    outbound_mailbox,
    uploader_id,
    cover_letter,
    education_entries,
    experience_entries,
    resume_url,
    social_profiles,
    location,
    originating_candidate_id,
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
    imageUrl: image_url,
    disqualifiedAt: disqualified_at,
    outboundMailbox: outbound_mailbox,
    uploaderId: uploader_id,
    coverLetter: cover_letter,
    educationEntries: education_entries?.map(toEducationEntryModel),
    experienceEntries: experience_entries?.map(toExperienceEntryModel),
    resumeUrl: resume_url,
    socialProfiles: social_profiles,
    location: location === null || location === undefined ? undefined : toLocationModel(location),
    originatingCandidateId: originating_candidate_id,
  }
}

export function toEducationEntryModel(
  schema: z.infer<typeof workable.educationEntrySchema>
): z.infer<typeof def.educationEntrySchema> {
  const { end_date, field_of_study, start_date, ...rest } = schema
  return {
    ...rest,
    fieldOfStudy: field_of_study,
    startDate: start_date,
    endDate: end_date,
  }
}

export function toExperienceEntryModel(
  schema: z.infer<typeof workable.experienceEntrySchema>
): z.infer<typeof def.experienceEntrySchema> {
  const { start_date, end_date, ...rest } = schema
  return {
    ...rest,
    startDate: start_date,
    endDate: end_date,
  }
}

export function toLocationModel(schema: z.infer<typeof workable.locationSchema>): z.infer<typeof def.locationSchema> {
  const { location_str, country_code, region_code, zip_code, ...rest } = schema
  return {
    ...rest,
    locationString: location_str,
    countryCode: country_code,
    regionCode: region_code,
    zipCode: zip_code,
  }
}

export function toGetCandidateModel(
  schema: z.infer<typeof workable.getCandidateOutputSchema>
): z.infer<typeof def.getCandidateOutputSchema> {
  return {
    candidate: schema.candidate === undefined ? undefined : toDetailedCandidateModel(schema.candidate),
  }
}
