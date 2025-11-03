import { z } from '@botpress/sdk'

export const getJobQuestionsInputSchema = z.object({
  shortCode: z.string().title('Shortcode').describe("The job's system generated code"),
})

export const questionType = z.enum(['free_text', 'multiple_choice', 'boolean', 'dropdown', 'numeric', 'date', 'file'])

export const questionSchema = z.object({
  id: z.string().title('id').describe("The question's id"),
  body: z.string().title('Body').describe("The question's body"),
  type: questionType.title('Question Type').describe("The question's type"),
  required: z.boolean().title('Required').describe('specifies wether providing an answer to the question is required'),
  singleAnswer: z
    .boolean()
    .optional()
    .title('Single Answer')
    .describe('Wether the question allows for multiple answers. Defined only for type multiple_choice.'),
  choices: z
    .array(
      z.object({
        id: z.string().title('ID').describe("The choice's id"),
        body: z.string().title('Body').describe("The choice's text"),
      })
    )
    .optional()
    .title('Choices')
    .describe('An array specifying the possible answers. Defined only for types multiple_choice and dropdown.'),
  supportedFileTypes: z
    .array(z.string())
    .optional()
    .title('Supported File Types')
    .describe('An array specifying the accepted file types. Defined only if question type is file.'),
  maxFileSize: z
    .number()
    .optional()
    .title('Max File Size')
    .describe('The maximum file size in bytes. Defined only if question is file'),
})

export const getJobQuestionsOutputSchema = z.object({
  questions: z.array(questionSchema).title('questions').describe('The questions'),
})
