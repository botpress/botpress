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
  errorMsg?: string
  updateQnA: (qnaItem: QnaItem) => void
  deleteQnA: () => void
  toggleEnabledQnA: () => void
}

const QnA: FC<Props> = props => {
  const [showOption, setShowOption] = useState(false)
  const {
    contentLang,
    qnaItem: { id, data },
    updateQnA,
    expanded,
    setExpanded,
    errorMsg
  } = props
  const questions = data.questions[contentLang]
  const answers = data.answers[contentLang]

  // Generating unique keys so we don't need to rerender all the list as soon as we add or delete one element
  const questionKeys = useRef([])
  const answerKeys = useRef([])

  useEffect(() => {
    questionKeys.current = questions.map(x => _uniqueId())
    answerKeys.current = answers.map(x => _uniqueId())
  }, [])

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
            <Icon icon={!expanded ? 'chevron-right' : 'chevron-down'} /> <h1>{questions?.[0]}</h1>
          </div>
          <div className={style.right}>
            {errorMsg && (
              <Tooltip position={Position.BOTTOM} content={errorMsg}>
                <span className={style.tag}>{lang.tr('module.qna.form.cantBeSaved')}</span>
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
                <span className={cx(style.tag, style.incomplete)}>{lang.tr('module.qna.form.incomplete')}</span>
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
