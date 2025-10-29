import { RuntimeError, z } from '@botpress/sdk'
import * as defs from 'definitions/models/answers'
import * as workable from 'src/workable-schemas/answers'

export function fromPostAnswerModel(
  schema: z.infer<typeof defs.postAnswerSchema>
): z.infer<typeof workable.postAnswerSchema> {
  const { questionKey, ...answers } = schema

  const definedValues = Object.entries(answers).filter(([, value]) => {
    if (value === undefined) {
      return false
    }
    if (Array.isArray(value) || typeof value === 'string') {
      return value.length > 0
    }
    return true
  })

  if (definedValues.length !== 1) {
    throw new RuntimeError(
      `One single answer must be provided for each question. Question '${questionKey}' has ${definedValues.length} answers.`
    )
  }

  const [rawKey, value] = definedValues[0]!

  const key = rawKey === 'fileUrl' ? 'file_url' : rawKey

  return { question_key: questionKey, [key]: value } as unknown as z.infer<typeof workable.postAnswerSchema>
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
