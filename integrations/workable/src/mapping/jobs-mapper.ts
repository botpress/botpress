import { z } from '@botpress/sdk'
import * as def from 'definitions/models/jobs'
import * as workable from 'src/workable-schemas/jobs'

export function toGetJobQuestionsOutputModel(
  schema: z.infer<typeof workable.getJobQuestionsOutputSchema>
): z.infer<typeof def.getJobQuestionsOutputSchema> {
  const { questions, ...rest } = schema
  const mappedQuestions = questions.map(toQuestionModel)

  return {
    ...rest,
    questions: mappedQuestions,
  }
}

function toQuestionModel(schema: z.infer<typeof workable.questionSchema>): z.infer<typeof def.questionSchema> {
  const { max_file_size, single_answer, supported_file_types, ...rest } = schema

  return {
    ...rest,
    maxFileSize: max_file_size,
    singleAnswer: single_answer,
    supportedFileTypes: supported_file_types,
  }
}

export function fromGetJobQuestionsInputModel(
  schema: z.infer<typeof def.getJobQuestionsInputSchema>
): z.infer<typeof workable.getJobQuestionsInputSchema> {
  return schema
}
