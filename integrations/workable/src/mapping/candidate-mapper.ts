import { z } from '@botpress/sdk'
import * as defEvents from 'definitions/events/candidates'
import * as def from 'definitions/models/candidates'
import * as workable from 'src/workable-schemas/candidates'
import * as workableEvents from 'src/workable-schemas/events'
import { fromPostAnswerModel, toAnswerModel } from './answers-mapper'
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
    answers,
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
    answers: answers?.map((answer) => toAnswerModel(answer)),
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

export function toCandidateCreatedEventModel(
  schema: z.infer<typeof workableEvents.candidateCreatedSchema>
): z.infer<typeof defEvents.candidateCreatedSchema> {
  const candidateModel = toDetailedCandidateModel(schema.data)
  const { event_type, fired_at, resource_type, ...rest } = schema
  return {
    ...rest,
    eventType: event_type,
    firedAt: fired_at,
    resourceType: resource_type,
    data: candidateModel,
  }
}

export function toCandidateMovedEventModel(
  schema: z.infer<typeof workableEvents.candidateMovedSchema>
): z.infer<typeof defEvents.candidateMovedSchema> {
  const candidateModel = toDetailedCandidateModel(schema.data)
  const { event_type, fired_at, resource_type, ...rest } = schema
  return {
    ...rest,
    eventType: event_type,
    firedAt: fired_at,
    resourceType: resource_type,
    data: candidateModel,
  }
}

export function fromPostEducationEntryModel(
  schema: z.infer<typeof def.postEducationEntrySchema>
): z.infer<typeof workable.postEducationEntrySchema> {
  const { endDate, startDate, fieldOfStudy, ...rest } = schema
  return {
    ...rest,
    end_date: endDate,
    start_date: startDate,
    field_of_study: fieldOfStudy,
  }
}

export function fromPostExperienceEntryModel(
  schema: z.infer<typeof workable.postExperienceEntrySchema>
): z.infer<typeof def.postExperienceEntrySchema> {
  const { start_date, end_date, ...rest } = schema
  return {
    ...rest,
    startDate: start_date,
    endDate: end_date,
  }
}

export function fromPostCandidateInJobInputModel(
  schema: z.infer<typeof def.postCandidateInJobInputSchema>
): z.infer<typeof workable.postCandidateInJobInputSchema> {
  const { candidate, ...rest } = schema

  const {
    educationEntries,
    experienceEntries,
    firstName,
    lastName,
    socialProfiles,
    answers,
    coverLetter,
    disqualificationReason,
    disqualifiedAt,
    ...candidateRest
  } = candidate

  return {
    ...rest,
    body: {
      candidate: {
        ...candidateRest,
        firstname: firstName,
        lastname: lastName,
        education_entries: educationEntries.map((entry) => fromPostEducationEntryModel(entry)),
        experience_entries: experienceEntries.map((entry) => fromPostExperienceEntryModel(entry)),
        social_profiles: socialProfiles,
        answers: answers?.map((answer) => fromPostAnswerModel(answer)),
        cover_letter: coverLetter,
        disqualification_reason: disqualificationReason,
        disqualified_at: disqualifiedAt,
      },
    },
  }
}
