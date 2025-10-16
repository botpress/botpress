import { ActionDefinition, z } from '@botpress/sdk'

const candidateModel = {
  id: z.string().optional().title('Id').describe('The candidate identifier'),
  name: z.string().optional().nullable().title('Name').describe('The candidate\'s full name'),
  firstName: z.string().optional().nullable().title('First Name').describe('The candidate\'s first name'),
  lastName: z.string().optional().nullable().title('Last Name').describe('The candidate\'s last name'),
  headline: z.string().optional().nullable().title('Headline').describe('The candidate\'s headline'),
  account: z.object({
    subdomain: z.string().optional().nullable().title('Subdomain').describe('The account subdomain'),
    name: z.string().optional().nullable().title('Account Name').describe('The account name'),
  }).optional().nullable().describe('The account details'),
  job: z.object({
    shortcode: z.string().optional().nullable().title('Shortcode').describe('The job\'s system generated code'),
    title: z.string().optional().nullable().title('Job Title').describe('The job title'),
  }).optional().nullable().describe('The job details'),
  stage: z.string().optional().nullable().title('Stage').describe('The candidate\'s current stage slug'),
  stageKind: z.string().optional().nullable().title('Stage').describe('The candidate\'s current stage kind'),
  disqualified: z.boolean().optional().nullable().title('Disqualified').describe('Flag indicating whether the candidate is disqualified'),
  withdrew: z.boolean().optional().nullable().optional().title('Withdrew').describe('Flag indicating whether the candidate withdrew'),
  disqualificationReason: z.string().optional().nullable().optional().title('Disqualification Reason').describe('Reason for disqualification, if applicable'),
  sourced: z.boolean().optional().nullable().title('Sourced').describe('Flag indicating whether the candidate has been sourced'),
  profileUrl: z.string().optional().nullable().title('Profile URL').describe('The URL to the candidate\'s profile in Workable'),
  email: z.string().optional().nullable().title('Email').describe('The candidate\'s email address'),
  domain: z.string().optional().nullable().title('Domain').describe('Where the candidate came from'),
  createdAt: z.string().optional().nullable().title('Created At').describe('The creation timestamp of the candidate record'),
  updatedAt: z.string().optional().nullable().title('Updated At').describe('The last update timestamp of the candidate record'),
  hiredAt: z.string().optional().nullable().title('Hired At').describe('The date the candidate was moved to the hired stage'),
  address: z.string().optional().nullable().title('Address').describe('The candidate\'s address'),
  phone: z.string().optional().nullable().title('Phone Number').describe('The candidate\'s phone number'),
};

const educationEntry = {
  id: z.string().optional().nullable().title('Id').describe('The education entry identifier'),
  degree: z.string().optional().nullable().title('Degree').describe('The graduation degree'),
  school: z.string().optional().nullable().title('School').describe('The name of the school graduated'),
  fieldOfStudy: z.string().optional().nullable().title('Field Of Study').describe('The field of study'),
  startDate: z.string().optional().nullable().title('Start Date').describe('The date started'),
  endDate: z.string().optional().nullable().title('End Date').describe('The date ended'),
}

const socialProfile = {
  type: z.string().optional().nullable().title('Type').describe('The slug name of the social profile'),
  name: z.string().optional().nullable().title('Name').describe('The full name of the social profile'),
  username: z.string().optional().nullable().title('Username').describe('The username of the social profile'),
  url: z.string().optional().nullable().title('Url').describe('Url to the candidate\'s social profile page'),
}

const experienceEntry = {
  id: z.string().optional().nullable().title('Id').describe('The experience entry identifier'),
  title: z.string().optional().nullable().title('Title').describe('The title of the experience entry'),
  summary: z.string().optional().nullable().title('Summary').describe('The summary of the experience entry'),
  startDate: z.string().optional().nullable().title('Start Date').describe('The date started'),
  endDate: z.string().optional().nullable().title('End Date').describe('The date ended'),
  company: z.string().optional().nullable().title('Company').describe('The copmany name'),
  industry: z.string().optional().nullable().title('Industry').describe('The industry of the company'),
  current: z.boolean().optional().nullable().title('Current').describe('Indicates if currently works there'),
}

const detailedCandidateModel = {
  ...candidateModel,
  imageUrl: z.string().optional().title('Image Url').describe('Url of candidate\'s avatar. Available only if provided by the candidate'),
  disqualifiedAt: z.string().optional().title('Disqualified At').describe('The timestamp the candidate was disqualified'),
  outboundMailbox: z.string().optional().title('Outbound Mailbox').describe('Mailbox that can be used to communicate with the candidate and inform the recruitment team of the job as well'),
  uploaderId: z.string().optional().title('Uploader Id').describe('The ID of the member who uploaded the candidate'),
  coverLetter: z.string().optional().title('Cover Letter').describe('The cover letter provided when the candidate applied'),
  summary: z.string().optional().title('Summary').describe('The summary of the candidate'),
  educationEntries: z.array(
      z.object(educationEntry).nullable()
    ).optional().nullable().title('Education Entries').describe('A collection with education entries'),
  experienceEntries: z.array(
      z.object(experienceEntry).optional().nullable()
    ).optional().nullable().title('Experience Entries').describe('A collection with experience entries'),
  skills: z.array(
      z.object({ name: z.string().optional().nullable().title('Name') })
    ).optional().nullable().title('Skills').describe('A collection of skills with names'),
  answers: z.array(z.string().optional().nullable()).title('Answers').describe('A collection with answers provided'),
  resumeUrl: z.string().title('Resume Url').optional().nullable().describe('Url to the candidate resume'),
  socialProfiles: z.array(
    z.object(socialProfile).optional().nullable()
  ).optional().nullable().title('Social Profiles').describe('A collection with social profiles of candidates'),
  tags: z.array(z.string().nullable()).optional().nullable().title('Tags').describe('A collection of tags'),
  location: z.object({
    locationString: z.string().optional().nullable().title('Location String').describe('The string representation of the location'),
    country: z.string().optional().nullable().title('Country').describe('The country full name'),
    countryCode: z.string().optional().nullable().title('CountryCode').describe('The 2-letter ISO code of the country'),
    region: z.string().optional().nullable().title('Region').describe('The region of the candidate'),
    regionCode: z.string().optional().nullable().title('Region Code').describe('The code of the region of the candidate'),
    city: z.string().optional().nullable().title('City').describe('The city of the candidate'),
    zipCode: z.string().optional().nullable().title('Zip Code').describe('The ZIP code of the candidate'),
  }).optional().nullable().title('Location').describe('The location of the candidate'),
  originatingCandidateId: z.string().optional().nullable().title('Originating Candidate Id').describe('The ID this candidate originated from'),
}

export const getCandidates = {
  title: 'Get candidates',
  description: 'Get the candidates for a job',
  input: {
    schema: z.object({
      email: z.string().optional().nullable().optional().title('Email').describe('The email of the candidate to filter by'),
      shortCode: z.string().optional().nullable().optional().title('Shortcode').describe('The job\'s system generated code'),
      stage: z.string().optional().nullable().optional().title('Stage').describe('The job\'s stage slug, can be retrieved from the \'/stages\' endpoint'),
      limit: z.number().optional().nullable().optional().title('Limit').describe('Specifies the number of candidates to try and retrieve per page'),
      sinceId: z.string().optional().nullable().optional().title('Since Id').describe('Returns results with an ID greater than or equal to the specified ID'),
      maxId: z.string().optional().nullable().optional().title('Max Id').describe('Returns results with an ID less than or equal to the specified ID'),
      createdAfter: z.string().optional().nullable().optional().title('Created After').describe('Returns results created after the specified timestamp'),
      updatedAfter: z.string().optional().nullable().optional().title('Updated After').describe('Returns results updated after the specified timestamp'),
    }),
  },
  output: {
    schema: z.object({
        candidates: z.array(z.object(candidateModel)).optional().title('Candidates').describe('The array of candidates'),
    }),
  },
} satisfies ActionDefinition

export const getCandidate = {
  title: 'Get candidate',
  description: 'Get a candidate by ID',
  input: {
    schema: z.object({
      id: z.string().title('ID').describe('The candidate\' ID'),
    }),
  },
  output: {
    schema: z.object({
        candidate: z.object(detailedCandidateModel).title('Candidate').describe('The candidate found'),
    }),
  },
} satisfies ActionDefinition
