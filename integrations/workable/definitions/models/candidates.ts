import { z } from '@botpress/sdk'

export const candidateModel = z
  .object({
    id: z.string().title('Id').describe('The candidate identifier'),
    name: z.string().title('Name').describe("The candidate's full name"),
    firstName: z.string().title('First Name').describe("The candidate's first name"),
    lastName: z.string().title('Last Name').describe("The candidate's last name"),
    email: z.string().nullable().title('Email').describe("The candidate's email address"),
    headline: z.string().nullable().title('Headline').describe("The candidate's headline"),
    account: z
      .object({
        subdomain: z.string().nullable().title('Subdomain').describe('The account subdomain'),
        name: z.string().nullable().title('Account Name').describe('The account name'),
      })
      .partial()
      .nullable()
      .describe('The account details'),
    job: z
      .object({
        shortCode: z.string().title('Shortcode').describe("The job's system generated code"),
        title: z.string().title('Job Title').describe('The job title'),
      })
      .partial()
      .describe('The job details'),
    stage: z.string().nullable().title('Stage').describe("The candidate's current stage slug"),
    stageKind: z.string().nullable().title('Stage').describe("The candidate's current stage kind"),
    disqualified: z.boolean().title('Disqualified').describe('Flag indicating whether the candidate is disqualified'),
    withdrew: z.boolean().title('Withdrew').describe('Flag indicating whether the candidate withdrew'),
    disqualificationReason: z
      .string()
      .nullable()
      .title('Disqualification Reason')
      .describe('Reason for disqualification, if applicable'),
    sourced: z.boolean().title('Sourced').describe('Flag indicating whether the candidate has been sourced'),
    profileUrl: z.string().nullable().title('Profile URL').describe("The URL to the candidate's profile in Workable"),
    domain: z.string().nullable().title('Domain').describe('Where the candidate came from'),
    createdAt: z.string().title('Created At').describe('The creation timestamp of the candidate record'),
    updatedAt: z.string().title('Updated At').describe('The last update timestamp of the candidate record'),
    hiredAt: z.string().nullable().title('Hired At').describe('The date the candidate was moved to the hired stage'),
    address: z.string().nullable().title('Address').describe("The candidate's address"),
    phone: z.string().nullable().title('Phone Number').describe("The candidate's phone number"),
  })
  .partial()

export const listCandidatesOutputModel = z.object({
  candidates: z.array(candidateModel).title('Candidates').describe('The array of candidates'),
  nextToken: z.string().optional().title('Next Token').describe('The token for the next page of results'),
})

export const listCandidatesInputModel = z
  .object({
    email: z.string().title('Email').describe('The email of the candidate to filter by'),
    shortCode: z.string().title('Shortcode').describe("The job's system generated code"),
    stage: z.string().title('Stage').describe("The job's stage slug, can be retrieved from the '/stages' endpoint"),
    limit: z.number().title('Limit').describe('Specifies the number of candidates to try and retrieve per page'),
    nextToken: z
      .string()
      .title('Next Token')
      .describe('Returns results with an ID greater than or equal to the specified ID'),
    createdAfter: z.string().title('Created After').describe('Returns results created after the specified timestamp'),
    updatedAfter: z.string().title('Updated After').describe('Returns results updated after the specified timestamp'),
  })
  .partial()

export const educationEntryModel = z
  .object({
    id: z.string().title('Id').describe('The education entry identifier'),
    degree: z.string().nullable().title('Degree').describe('The graduation degree'),
    school: z.string().title('School').describe('The name of the school graduated'),
    fieldOfStudy: z.string().nullable().title('Field Of Study').describe('The field of study'),
    startDate: z.string().nullable().title('Start Date').describe('The date started'),
    endDate: z.string().nullable().title('End Date').describe('The date ended'),
  })
  .partial()

export const socialProfileModel = z
  .object({
    type: z.string().title('Type').describe('The slug name of the social profile'),
    name: z.string().nullable().title('Name').describe('The full name of the social profile'),
    username: z.string().nullable().title('Username').describe('The username of the social profile'),
    url: z.string().title('Url').describe("Url to the candidate's social profile page"),
  })
  .partial()

export const experienceEntryModel = z
  .object({
    id: z.string().title('Id').describe('The experience entry identifier'),
    title: z.string().title('Title').describe('The title of the experience entry'),
    summary: z.string().nullable().title('Summary').describe('The summary of the experience entry'),
    startDate: z.string().nullable().title('Start Date').describe('The date started'),
    endDate: z.string().nullable().title('End Date').describe('The date ended'),
    company: z.string().nullable().title('Company').describe('The company name'),
    industry: z.string().nullable().title('Industry').describe('The industry of the company'),
    current: z.boolean().nullable().title('Current').describe('Indicates if currently works there'),
  })
  .partial()

export const answerModel = z.object({
  question: z.object({
    body: z.string().nullable().title('Question').describe('The question'),
  }),
  answer: z.unknown().nullable().title('Answer').describe('The answer'),
})

export const locationModel = z
  .object({
    locationString: z
      .string()
      .nullable()
      .title('Location String')
      .describe('The string representation of the location'),
    country: z.string().nullable().title('Country').describe('The country full name'),
    countryCode: z.string().nullable().title('CountryCode').describe('The 2-letter ISO code of the country'),
    region: z.string().nullable().title('Region').describe('The region of the candidate'),
    regionCode: z.string().nullable().title('Region Code').describe('The code of the region of the candidate'),
    city: z.string().nullable().title('City').describe('The city of the candidate'),
    zipCode: z.string().nullable().title('Zip Code').describe('The ZIP code of the candidate'),
  })
  .partial()

export const detailedCandidateModel = candidateModel
  .extend({
    imageUrl: z
      .string()
      .nullable()
      .title('Image Url')
      .describe("Url of candidate's avatar. Available only if provided by the candidate"),
    disqualifiedAt: z
      .string()
      .nullable()
      .title('Disqualified At')
      .describe('The timestamp the candidate was disqualified'),
    outboundMailbox: z
      .string()
      .nullable()
      .title('Outbound Mailbox')
      .describe(
        'Mailbox that can be used to communicate with the candidate and inform the recruitment team of the job as well'
      ),
    uploaderId: z.string().nullable().title('Uploader Id').describe('The ID of the member who uploaded the candidate'),
    coverLetter: z
      .string()
      .nullable()
      .title('Cover Letter')
      .describe('The cover letter provided when the candidate applied'),
    summary: z.string().nullable().title('Summary').describe('The summary of the candidate'),
    educationEntries: z
      .array(educationEntryModel)
      .title('Education Entries')
      .describe('A collection with education entries'),
    experienceEntries: z
      .array(experienceEntryModel)
      .title('Experience Entries')
      .describe('A collection with experience entries'),
    skills: z
      .array(z.object({ name: z.string().title('Name') }).partial())
      .title('Skills')
      .describe('A collection of skills with names'),
    answers: z.array(answerModel).title('Answers').describe('A collection with answers provided'),
    resumeUrl: z.string().nullable().title('Resume Url').describe('Url to the candidate resume'),
    socialProfiles: z
      .array(socialProfileModel)
      .title('Social Profiles')
      .describe('A collection with social profiles of candidates'),
    tags: z.array(z.string()).title('Tags').describe('A collection of tags'),
    location: locationModel.title('Location').nullable().describe('The location of the candidate'),
    originatingCandidateId: z
      .string()
      .nullable()
      .title('Originating Candidate Id')
      .describe('The ID this candidate originated from'),
  })
  .partial()

export const getCandidateOutputModel = z
  .object({
    candidate: detailedCandidateModel.title('Candidate').describe('The candidate found'),
  })
  .partial()

export const getCandidateInputModel = z.object({
  id: z.string().title('ID').describe("The candidate's ID"),
})
