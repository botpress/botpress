import { MultiLangText } from 'botpress/sdk'
import lang from 'common/lang'
import _ from 'lodash'

export const getConfirmPromptQuestion = (messages: MultiLangText | undefined, value: any) => {
  let question = lang.tr('module.builtin.prompt.confirmValue', { value })

  if (messages) {
    question = _.mapValues(messages, (q, lang) => (q.length > 0 ? q.replace(`$value`, value) : question[lang]))
  }

  return question
}
