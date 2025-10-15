import { ActionDefinition, z } from '@botpress/sdk'

const candidateModel = {
  id: z.string().title('Id').describe('The candidate identifier'),
  name: z.string().title('Name').describe('The candidate\'s full name'),
  firstName: z.string().title('First Name').describe('The candidate\'s first name'),
  lastName: z.string().title('Last Name').describe('The candidate\'s last name'),
  headline: z.string().title('Headline').describe('The candidate\'s headline'),
  account: z.object({
    subdomain: z.string().title('Subdomain').describe('The account subdomain'),
    name: z.string().title('Account Name').describe('The account name'),
  }).describe('The account details'),
  job: z.object({
    shortcode: z.string().title('Shortcode').describe('The job\'s system generated code'),
    title: z.string().title('Job Title').describe('The job title'),
  }).describe('The job details'),
  stage: z.string().title('Stage').describe('The candidate\'s current stage slug'),
  stageKind: z.string().title('Stage').describe('The candidate\'s current stage kind'),
  disqualified: z.boolean().title('Disqualified').describe('Flag indicating whether the candidate is disqualified'),
  withdrew: z.boolean().title('Withdrew').describe('Flag indicating whether the candidate withdrew'),
  disqualificationReason: z.string().nullable().optional().title('Disqualification Reason').describe('Reason for disqualification, if applicable'),
  sourced: z.boolean().title('Sourced').describe('Flag indicating whether the candidate has been sourced'),
  profileUrl: z.string().url().title('Profile URL').describe('The URL to the candidate\'s profile in Workable'),
  email: z.string().email().title('Email').describe('The candidate\'s email address'),
  domain: z.string().title('Domain').describe('Where the candidate came from'),
  createdAt: z.string().title('Created At').describe('The creation timestamp of the candidate record'),
  updatedAt: z.string().title('Updated At').describe('The last update timestamp of the candidate record'),
  hiredAt: z.string().title('Hired At').describe('The date the candidate was moved to the hired stage'),
  address: z.string().title('Address').describe('The candidate\'s address'),
  phone: z.string().title('Phone Number').describe('The candidate\'s phone number'),
};

export const getCandidates = {
  title: 'Get candidates',
  description: 'Get the candidates for a job',
  input: {
    schema: z.object({
      email: z.string().nullable().title('Email').describe('The email of the candidate to filter by'),
      shortCode: z.string().nullable().title('Shortcode').describe('The job\'s system generated code'),
      stage: z.string().nullable().title('Stage').describe('The job\'s stage slug, can be retrieved from the \'/stages\' endpoint'),
      limit: z.number().nullable().title('Limit').describe('Specifies the number of candidates to try and retrieve per page'),
      sinceId: z.string().nullable().title('Since Id').describe('Returns results with an ID greater than or equal to the specified ID'),
      maxId: z.string().nullable().title('Max Id').describe('Returns results with an ID less than or equal to the specified ID'),
      createdAfter: z.string()
        .refine(val => !isNaN(Date.parse(val)), {
          message: "Invalid datetime format",
        }).nullable().title('Created After').describe('Returns results created after the specified timestamp'),
      updatedAfter: z.string()
        .refine(val => !isNaN(Date.parse(val)), {
          message: "Invalid datetime format",
        }).nullable().title('Updated After').describe('Returns results updated after the specified timestamp'),
    }),
  },
  output: {
    schema: z.object({
      results: z.object({
        candidates: z.array(z.object(candidateModel)).title('Candidates').describe('The array of candidates.'),
    })}),
  },
} satisfies ActionDefinition
