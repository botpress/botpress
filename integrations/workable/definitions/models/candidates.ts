import { z } from '@botpress/sdk'
import { answerSchema, postAnswerSchema } from './answers'

export const socialProfileTypesSchema = z.enum([
  'academiaedu',
  'angellist',
  'behance',
  'bitbucket',
  'blogger',
  'crunchbase',
  'dandyid',
  'delicious',
  'deviantart',
  'digg',
  'doyoubuzz',
  'dribble',
  'dribbble',
  'econsultancy',
  'facebook',
  'flavorsme',
  'flickr',
  'fullcontact',
  'getglue',
  'gist',
  'github',
  'goodreads',
  'googleplus',
  'gravatar',
  'hackernews',
  'hiim',
  'klout',
  'lanyrd',
  'linkedin',
  'myspace',
  'ohloh',
  'orkut',
  'pinterest',
  'quora',
  'reddit',
  'scribd',
  'slideshare',
  'stackexchange',
  'stackoverflow',
  'tumblr',
  'twitter',
  'typepad',
  'vk',
  'wordpress',
  'xing',
])

export const baseCandidateSchema = z
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

export const candidateSchema = baseCandidateSchema
  .extend({
    job: z
      .object({
        shortCode: z.string().title('Shortcode').describe("The job's system generated code"),
        title: z.string().title('Job Title').describe('The job title'),
      })
      .partial()
      .describe('The job details'),
  })
  .partial()

export const listCandidatesOutputSchema = z.object({
  candidates: z.array(candidateSchema).title('Candidates').describe('The array of candidates'),
  nextToken: z.string().optional().title('Next Token').describe('The token for the next page of results'),
})

export const listCandidatesInputSchema = z
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

export const educationEntrySchema = z
  .object({
    id: z.string().title('Id').describe('The education entry identifier'),
    degree: z.string().nullable().title('Degree').describe('The graduation degree'),
    school: z.string().title('School').describe('The name of the school graduated'),
    fieldOfStudy: z.string().nullable().title('Field Of Study').describe('The field of study'),
    startDate: z.string().nullable().title('Start Date').describe('The date started'),
    endDate: z.string().nullable().title('End Date').describe('The date ended'),
  })
  .partial()

export const socialProfileSchema = z
  .object({
    type: z.string().title('Type').describe('The slug name of the social profile'),
    name: z.string().nullable().title('Name').describe('The full name of the social profile'),
    username: z.string().nullable().title('Username').describe('The username of the social profile'),
    url: z.string().title('Url').describe("Url to the candidate's social profile page"),
  })
  .partial()

export const experienceEntrySchema = z
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

export const updateEducationEntrySchema = z.object({
  id: z.string().optional().title('Id').describe('The education entry identifier'),
  degree: z.string().optional().title('Degree').describe('The graduation degree'),
  school: z.string().title('School').describe('The name of the school graduated'),
  fieldOfStudy: z.string().optional().title('Field Of Study').describe('The field of study'),
  startDate: z.string().optional().title('Start Date').describe('The date started'),
  endDate: z.string().optional().title('End Date').describe('The date ended'),
})

export const updateSocialProfileSchema = z.object({
  type: socialProfileTypesSchema.title('Type').describe('The slug name of the social profile'),
  name: z.string().optional().title('Name').describe('The full name of the social profile'),
  username: z.string().optional().title('Username').describe('The username of the social profile'),
  url: z.string().title('Url').describe("Url to the candidate's social profile page"),
})

export const updateExperienceEntrySchema = z.object({
  id: z.string().optional().title('Id').describe('The experience entry identifier'),
  title: z.string().title('Title').describe('The title of the experience entry'),
  summary: z.string().optional().title('Summary').describe('The summary of the experience entry'),
  startDate: z.string().optional().title('Start Date').describe('The date started'),
  endDate: z.string().optional().title('End Date').describe('The date ended'),
  company: z.string().optional().title('Company').describe('The company name'),
  industry: z.string().optional().title('Industry').describe('The industry of the company'),
  current: z.boolean().optional().title('Current').describe('Indicates if currently works there'),
})

export const locationSchema = z
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

const detailedCandidateSchemaExtraFields = {
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
    .array(educationEntrySchema)
    .title('Education Entries')
    .describe('A collection with education entries'),
  experienceEntries: z
    .array(experienceEntrySchema)
    .title('Experience Entries')
    .describe('A collection with experience entries'),
  skills: z
    .array(z.object({ name: z.string().title('Name') }).partial())
    .title('Skills')
    .describe('A collection of skills with names'),
  answers: z.array(answerSchema).title('Answers').describe('A collection with answers provided'),
  resumeUrl: z.string().nullable().title('Resume Url').describe('Url to the candidate resume'),
  socialProfiles: z
    .array(socialProfileSchema)
    .title('Social Profiles')
    .describe('A collection with social profiles of candidates'),
  tags: z.array(z.string()).title('Tags').describe('A collection of tags'),
  location: locationSchema.title('Location').nullable().describe('The location of the candidate'),
  originatingCandidateId: z
    .string()
    .nullable()
    .title('Originating Candidate Id')
    .describe('The ID this candidate originated from'),
}

export const baseDetailedCandidateSchema = baseCandidateSchema.extend(detailedCandidateSchemaExtraFields).partial()

export const detailedCandidateSchema = candidateSchema.extend(detailedCandidateSchemaExtraFields).partial()

export const getCandidateOutputSchema = z
  .object({
    candidate: detailedCandidateSchema.title('Candidate').describe('The candidate found'),
  })
  .partial()

export const getCandidateInputSchema = z.object({
  id: z.string().title('ID').describe("The candidate's ID"),
})

export const postEducationEntrySchema = z.object({
  degree: z.string().optional().title('Degree').describe('The graduation degree'),
  school: z.string().title('School').describe('The name of the school graduated'),
  fieldOfStudy: z.string().optional().title('Field Of Study').describe('The field of study'),
  startDate: z.string().optional().title('Start Date').describe('The date started'),
  endDate: z.string().optional().title('End Date').describe('The date ended'),
})

export const postSocialProfileSchema = z.object({
  type: socialProfileTypesSchema.title('Type').describe('The slug name of the social profile'),
  username: z.string().optional().title('Username').describe('The username of the social profile'),
  url: z.string().title('Url').describe("Url to the candidate's social profile page"),
})

export const postExperienceEntrySchema = z.object({
  title: z.string().title('Title').describe('The title of the experience entry'),
  summary: z.string().optional().title('Summary').describe('The summary of the experience entry'),
  startDate: z.string().optional().title('Start Date').describe('The date started'),
  endDate: z.string().optional().title('End Date').describe('The date ended'),
  company: z.string().optional().title('Company').describe('The company name'),
  current: z.boolean().optional().title('Current').describe('Indicates if currently works there'),
  industry: z.string().optional().title('Industry').describe('The industry of the company'),
})

export const postCandidateInTalentPoolSchema = z.object({
  firstName: z.string().title('First Name').describe("The candidate's first name"),
  lastName: z.string().title('Last Name').describe("The candidate's last name"),
  email: z.string().title('Email').describe("The candidate's email address"),
  headline: z.string().optional().title('Headline').describe("The candidate's headline"),
  summary: z.string().optional().title('Summary').describe('The summary of the candidate'),
  address: z.string().optional().title('Address').describe("The candidate's address"),
  phone: z.string().optional().title('Phone Number').describe("The candidate's phone number"),
  coverLetter: z
    .string()
    .optional()
    .title('Cover Letter')
    .describe('The cover letter provided when the candidate applied'),
  educationEntries: z
    .array(postEducationEntrySchema)
    .optional()
    .title('Education Entries')
    .describe('A collection with education entries'),
  experienceEntries: z
    .array(postExperienceEntrySchema)
    .optional()
    .title('Experience Entries')
    .describe('A collection with experience entries'),
  skills: z.array(z.string()).optional().title('Skills').describe('A collection of skills with names'),
  tags: z.array(z.string()).optional().title('Tags').describe('A collection of tags'),
  disqualified: z
    .boolean()
    .optional()
    .title('Disqualified')
    .describe('Flag indicating whether the candidate is disqualified'),
  disqualificationReason: z
    .string()
    .optional()
    .title('Disqualification Reason')
    .describe('Reason for disqualification, if applicable'),
  disqualifiedAt: z
    .string()
    .optional()
    .title('Disqualified At')
    .describe('The timestamp the candidate was disqualified'),
  socialProfiles: z
    .array(postSocialProfileSchema)
    .optional()
    .title('Social Profiles')
    .describe('A collection with social profiles of candidates'),
  domain: z.string().optional().title('Domain').describe('Where the candidate came from'),
  recruiterKey: z
    .string()
    .optional()
    .title('Recruiter Key')
    .describe('The key corresponding to the recruiter who sourced the candidate'),
  resumeUrl: z.string().optional().title('Resume Url').describe('Url to the candidate resume'),
  resume: z
    .object({
      name: z.string().title('Name').describe('The name of the file'),
      data: z.string().title('Data').describe('The base64 encoded data'),
    })
    .optional(),
})

export const postCandidateInJobSchema = postCandidateInTalentPoolSchema.extend({
  answers: z.array(postAnswerSchema).optional().title('Answers').describe('A collection with answers provided'),
})

export const postCandidateInJobOutputSchema = z.object({
  status: z.string().title('Status').describe('The status of the candidate'),
  candidate: detailedCandidateSchema.title('Candidate').describe('The candidate created'),
})

export const postCandidateInTalentPoolOutputSchema = z.object({
  status: z.string().title('Status').describe('The status of the candidate'),
  candidate: baseDetailedCandidateSchema
    .extend({
      talentPool: z
        .object({
          talentPoolId: z.number().title('Talent Pool ID').describe('The ID of the candidate in the talent pool'),
        })
        .title('Talent Pool')
        .describe('The talent pool fields'),
    })
    .title('Candidate')
    .describe('The candidate created'),
})

export const postCandidateInTalentPoolInputSchema = z.object({
  sourced: z.boolean().optional().title('Sourced').describe('Indicates if the candidate is sourced or applied'),
  candidate: postCandidateInTalentPoolSchema.title('Candidate').describe('The candidate to create'),
})

export const postCandidateInJobInputSchema = z.object({
  sourced: z.boolean().optional().title('Sourced').describe('Indicates if the candidate is sourced or applied'),
  candidate: postCandidateInJobSchema.title('Candidate').describe('The candidate to create'),
  shortCode: z.string().title('Short Code').describe('The shortcode of the job the candidate is applying to'),
})

export const imageSource = z.enum([
  'academiaedu',
  'angellist',
  'behance',
  'bitbucket',
  'blogger',
  'crunchbase',
  'dandyid',
  'delicious',
  'deviantart',
  'digg',
  'doyoubuzz',
  'dribble',
  'dribbble',
  'econsultancy',
  'facebook',
  'flavorsme',
  'flickr',
  'fullcontact',
  'getglue',
  'gist',
  'github',
  'goodreads',
  'googleplus',
  'gravatar',
  'hackernews',
  'hiim',
  'klout',
  'lanyrd',
  'linkedin',
  'myspace',
  'ohloh',
  'orkut',
  'pinterest',
  'quora',
  'reddit',
  'scribd',
  'skype',
  'slideshare',
  'stackexchange',
  'stackoverflow',
  'tumblr',
  'twitter',
  'typepad',
  'vk',
  'wordpress',
  'xing',
])

export const updateCandidateInputSchema = z.object({
  id: z.string().title('ID').describe("The candidate to update's id"),
  candidate: postCandidateInTalentPoolSchema
    .extend({
      textingConsent: z.enum(['forced', 'declined']).title('Texting Consent'),
      imageUrl: z.string().title('Image Url').describe("A url pointing to the candidate's image"),
      imageSource: imageSource
        .title('Image Source')
        .describe('The source of the image (if not provided by the candidate)'),
      image: z
        .object({
          name: z.string().title('Name').describe("The candidate's image name"),
          data: z.string().title('Data').describe("The candidate's image encodede in base64"),
          source: imageSource.title('Image Source').describe('The image source'),
        })
        .partial(),
      educationEntries: z
        .array(updateEducationEntrySchema)
        .describe('Existing entries will be deleted if not included in the new array.'),
      experienceEntries: z
        .array(updateExperienceEntrySchema)
        .describe('Existing entries will be deleted if not included in the new array.'),
      socialProfiles: z
        .array(updateSocialProfileSchema)
        .describe('Existing profiles will be deleted if not included in the new array.'),
    })
    .omit({
      disqualified: true,
      disqualificationReason: true,
      disqualifiedAt: true,
      domain: true,
      recruiterKey: true,
    })
    .partial()
    .title('Candidate')
    .describe('The candidate to update'),
})

export const updateCandidateOutputSchema = z.object({
  candidate: detailedCandidateSchema.title('Candidate').describe('The candidate updated'),
})
