import { Button, Icon, Position, Tooltip } from '@blueprintjs/core'
import { confirmDialog, lang, MoreOptions, MoreOptionsItems } from 'botpress/shared'
import cx from 'classnames'
import _uniqueId from 'lodash/uniqueId'
import React, { FC, useEffect, useRef, useState } from 'react'

import { QnaItem } from '../../../backend/qna'
import style from '../style.scss'

import TextAreaList from './TextAreaList'

interface Props {
  expanded: boolean
  setExpanded: (expanded: boolean) => void
  qnaItem: QnaItem
  contentLang: string
  defaultLanguage: string
  errorMessages?: string[]
  updateQnA: (qnaItem: QnaItem) => void
  deleteQnA: () => void
  toggleEnabledQnA: () => void
}

const QnA: FC<Props> = props => {
  const [showOption, setShowOption] = useState(false)
  const {
    contentLang,
    qnaItem: { id, saveError, data },
    updateQnA,
    expanded,
    setExpanded,
    errorMessages,
    defaultLanguage
  } = props
  let questions = data.questions[contentLang]
  let answers = data.answers[contentLang]
  const refQuestions = contentLang !== defaultLanguage && data.questions[defaultLanguage]
  const refAnswers = contentLang !== defaultLanguage && data.answers[defaultLanguage]

  if (refQuestions && refQuestions.length > questions.length) {
    questions = [...questions, ...Array(refQuestions.length - questions.length).fill('')]
  }

  if (refAnswers && refAnswers.length > answers.length) {
    answers = [...answers, ...Array(refAnswers.length - answers.length).fill('')]
  }

  const onDelete = async () => {
    if (
      await confirmDialog(lang.tr('module.qna.form.confirmDeleteQuestion'), {
        acceptLabel: lang.tr('delete')
      })
    ) {
      props.deleteQnA()
    }
  }

  const moreOptionsItems: MoreOptionsItems[] = [
    {
      label: lang.tr(data.enabled ? 'module.qna.form.disableQuestion' : 'module.qna.form.enableQuestion'),
      action: props.toggleEnabledQnA
    },
    {
      label: lang.tr('module.qna.form.deleteQuestion'),
      type: 'delete',
      action: onDelete
    }
  ]

  const getPlaceholder = (type: 'answer' | 'question', index: number): string => {
    if (type === 'question') {
      if (index === 0) {
        return lang.tr('module.qna.form.writeFirstQuestion')
      } else if (index === 1 || index === 2) {
        return lang.tr('module.qna.form.writeAtLeastTwoMoreQuestions')
      } else if (index >= 3 && index < 9) {
        return lang.tr('module.qna.form.addMoreQuestionsPlural', { count: 10 - index })
      } else if (index === 9) {
        return lang.tr('module.qna.form.addMoreQuestionsSingular')
      }
    } else {
      if (index === 0) {
        return lang.tr('module.qna.form.writeTheAnswer')
      } else {
        return lang.tr('module.qna.form.chatbotWillRandomlyChoose')
      }
    }
  }

  const showIncomplete = questions.filter(q => !!q.trim()).length < 3 || answers.filter(q => !!q.trim()).length < 1

  return (
    <div className={style.questionWrapper}>
      <div className={style.headerWrapper}>
        <Button minimal small onClick={() => setExpanded(!expanded)} className={style.questionHeader}>
          <div className={style.left}>
            <Icon icon={!expanded ? 'chevron-right' : 'chevron-down'} />{' '}
            <h1>{questions?.[0] || <span className={style.refTitle}>{refQuestions?.[0]}</span>}</h1>
          </div>
          <div className={style.right}>
            {(!!errorMessages.length || saveError?.error === 'duplicated_question') && (
              <Tooltip
                position={Position.BOTTOM}
                content={
                  <ul className={style.errorsList}>
                    {errorMessages.map((error, index) => (
                      <li key={index}>{error}</li>
                    ))}
                    {saveError?.error === 'duplicated_question' && (
                      <li>{lang.tr('module.qna.form.writingSameQuestion')}</li>
                    )}
                  </ul>
                }
              >
                <span className={cx(style.tag, style.warning)}>{lang.tr('module.qna.form.cantBeSaved')}</span>
              </Tooltip>
            )}
            {!expanded && (
              <span className={style.tag}>{`${questions.filter(answer => answer.trim()).length} ${lang.tr(
                'module.qna.form.q'
              )} · ${answers.filter(answer => answer.trim()).length}  ${lang.tr('module.qna.form.a')}`}</span>
            )}
            {!data.enabled && (
              <Tooltip position={Position.BOTTOM} content={lang.tr('module.qna.form.disabledTooltip')}>
                <span className={style.tag}>{lang.tr('disabled')}</span>
              </Tooltip>
            )}
            {showIncomplete && (
              <Tooltip position={Position.BOTTOM} content={lang.tr('module.qna.form.incompleteTooltip')}>
                <span className={cx(style.tag, style.warning)}>{lang.tr('module.qna.form.incomplete')}</span>
              </Tooltip>
            )}
          </div>
        </Button>
        <MoreOptions show={showOption} onToggle={() => setShowOption(!showOption)} items={moreOptionsItems} />
      </div>
      {expanded && (
        <div className={style.collapsibleWrapper}>
          <TextAreaList
            key="questions"
            items={questions}
            updateItems={items =>
              updateQnA({
                id,
                data: { ...data, questions: { ...data.questions, [contentLang]: items }, answers: data.answers }
              })
            }
            refItems={refQuestions}
            keyPrefix="question-"
            duplicateMsg={lang.tr('module.qna.form.duplicateQuestion')}
            placeholder={index => getPlaceholder('question', index)}
            label={lang.tr('module.qna.question')}
            addItemLabel={lang.tr('module.qna.form.addQuestionAlternative')}
          />
          <TextAreaList
            key="answers"
            items={answers}
            duplicateMsg={lang.tr('module.qna.form.duplicateAnswer')}
            updateItems={items =>
              updateQnA({
                id,
                data: { ...data, questions: data.questions, answers: { ...data.answers, [contentLang]: items } }
              })
            }
            refItems={refAnswers}
            keyPrefix="answer-"
            placeholder={index => getPlaceholder('answer', index)}
            label={lang.tr('module.qna.answer')}
            canAddContent
            addItemLabel={lang.tr('module.qna.form.addAnswerAlternative')}
          />
        </div>
      )}
    </div>
  )
}

export default QnA
