import { z } from '@botpress/sdk'

export const listSubmissionsInputSchema = z.object({
  formId: z.string().title('Form ID').describe('Tally form ID'),
  page: z.number().int().min(1).optional().describe('Page number for pagination').title('Page'),
  filter: z.enum(['all', 'completed', 'partial']).optional().describe('Filter submissions by status').title('Filter'),
  startDate: z.string().optional().describe('Start date for filtering submissions').title('Start Date'),
  endDate: z.string().optional().describe('End date for filtering submissions').title('End Date'),
  afterId: z.string().optional().describe('ID of the submission after which to start listing').title('After ID'),
})

export const listSubmissionsOuputSchema = z.object({
  questions: z
    .array(
      z.object({
        id: z.string().describe('Question ID').title('Question ID'),
        type: z.string().optional().describe('Question type').title('Type'),
        title: z.string().nullable().optional().describe('Question title').title('Title'),
      })
    )
    .describe('List of questions')
    .title('Questions'),
  submissions: z
    .array(
      z.object({
        id: z.string().describe('Submission ID').title('Submission ID'),
        responses: z
          .array(
            z.object({
              questionId: z.string().describe('Question ID').title('Question ID'),
              value: z.any().optional().describe('Response value').title('Value'),
              answer: z.any().optional().describe('Response answer').title('Answer'),
            })
          )
          .describe('List of responses for this submission')
          .title('Responses'),
      })
    )
    .describe('List of submissions')
    .title('Submissions'),
})
