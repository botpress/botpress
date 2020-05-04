import { Button, Icon } from '@blueprintjs/core'
import { confirmDialog, lang, MoreOptions, MoreOptionsItems } from 'botpress/shared'
import cx from 'classnames'
import _uniqueId from 'lodash/uniqueId'
import React, { FC, useEffect, useRef, useState } from 'react'

import { QnaEntry, QnaItem } from '../../../backend/qna'
import style from '../style.scss'

import TextAreaList from './TextAreaList'

interface Props {
  qnaItem: QnaItem
  contentLang: string
  updateQnA: (questions: QnaEntry) => void
  deleteQnA: () => void
  toggleEnabledQnA: () => void
}

const QnA: FC<Props> = props => {
  const [showOption, setShowOption] = useState(false)
  const [collapsed, setCollapsed] = useState(!props.qnaItem.isNew)
  const {
    contentLang,
    qnaItem: { data },
    updateQnA
  } = props
  const questions = data.questions[contentLang]
  const answers = data.answers[contentLang]
  const focusedElement = useRef(`question-${questions.length - 1}`)

  // Generating unique keys so we don't need to rerender all the list as soon as we add or delete one element
  const questionKeys = useRef([])
  const answerKeys = useRef([])

  useEffect(() => {
    questionKeys.current = [...Array(questions.length)].map(x => _uniqueId())
    answerKeys.current = [...Array(answers.length)].map(x => _uniqueId())
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
        <Button minimal small onClick={() => setCollapsed(!collapsed)} className={style.questionHeader}>
          <div className={style.left}>
            <Icon icon={collapsed ? 'chevron-right' : 'chevron-down'} /> <h1>{questions?.[0]}</h1>
          </div>
          <div className={style.right}>
            {!data.enabled && <span className={style.tag}>Disabled</span>}
            {showIncomplete && <span className={cx(style.tag, style.incomplete)}>Incomplete</span>}
          </div>
        </Button>
        <MoreOptions show={showOption} onToggle={() => setShowOption(!showOption)} items={moreOptionsItems} />
      </div>
      {!collapsed && (
        <div className={style.collapsibleWrapper}>
          <TextAreaList
            key="questions"
            initialFocus={focusedElement.current}
            items={questions}
            updateItems={items =>
              updateQnA({ ...data, questions: { ...data.questions, [contentLang]: items }, answers: data.answers })
            }
            keyPrefix="question-"
            placeholder={index => getPlaceholder('question', index)}
            label={lang.tr('module.qna.question')}
            addItemLabel={lang.tr('module.qna.form.addQuestionAlternative')}
          />
          <TextAreaList
            key="answers"
            initialFocus={focusedElement.current}
            items={answers}
            updateItems={items =>
              updateQnA({ ...data, questions: data.questions, answers: { ...data.answers, [contentLang]: items } })
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
