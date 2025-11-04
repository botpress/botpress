import { getJobQuestionsInputSchema, getJobQuestionsOutputSchema } from 'definitions/models/jobs'

export const getJobQuestions = {
  title: 'Get job questions',
  description: 'Get the questions associated with a job offer',
  input: {
    schema: getJobQuestionsInputSchema,
  },
  output: {
    schema: getJobQuestionsOutputSchema,
  },
}
