import { z } from '@botpress/sdk'
import * as defs from 'definitions/models/answers'
import * as workable from 'src/workable-schemas/answers'

export function fromPostAnswerModel(
  schema: z.infer<typeof defs.postAnswerSchema>
): z.infer<typeof workable.postAnswerSchema> {
  const { questionKey, ...rest } = schema
  if ('fileUrl' in rest) {
    const { fileUrl, ...newRest } = rest
    return { ...newRest, question_key: schema.questionKey, file_url: fileUrl }
  } else if ('choice' in rest) {
    const { choice, ...newRest } = rest
    return {
      ...newRest,
      question_key: schema.questionKey,
      choices: [choice],
    }
  }
  return { ...rest, question_key: questionKey }
}

export function toAnswerModel(schema: z.infer<typeof workable.answerSchema>): z.infer<typeof defs.answerSchema> {
  const { answer, ...rest } = schema
  if (answer === null) {
    return {
      ...rest,
      answer,
    }
  }
  if ('file_url' in answer) {
    const { file_url, ...answerRest } = answer
    return {
      ...rest,
      answer: {
        ...answerRest,
        fileUrl: file_url,
      },
    }
  } else if ('choices' in answer) {
    const { choices, ...answerRest } = answer
    return {
      ...rest,
      answer: {
        ...answerRest,
        choices: choices.map((choice) => choice.body),
      },
    }
  }
  return { ...rest, answer }
}
