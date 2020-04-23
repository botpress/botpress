import { Button, Icon } from '@blueprintjs/core'
import { confirmDialog, lang, MoreOptions, Textarea } from 'botpress/shared'
import _uniqueId from 'lodash/uniqueId'
import React, { FC, useEffect, useRef, useState } from 'react'

import { MoreOptionsItems } from '../../../../../../src/bp/ui-shared/src/MoreOptions/typings'
import style from '../style.scss'

interface Props {
  question: any
  contentLang: string
  updateQnA: (questions: any) => void
  deleteQnA: () => void
  toogleEnabledQnA: () => void
}

const QnA: FC<Props> = props => {
  const [showOption, setShowOption] = useState(false)
  const [collapsed, setCollapsed] = useState(true)
  const focusedElement = useRef('')
  const {
    contentLang,
    question: { data },
    updateQnA
  } = props
  const questionKeys = useRef([])
  const answerKeys = useRef([])
  const questions = data.questions[contentLang]
  const answers = data.answers[contentLang]

  useEffect(() => {
    focusedElement.current = `question-${questions.length - 1}`
    questionKeys.current = [...Array(questions.length)].map(x => _uniqueId())
    answerKeys.current = [...Array(answers.length)].map(x => _uniqueId())
  }, [])

  const updateQuestion = (index, value) => {
    questions[index] = value
    updateQnA({ ...data, questions: { ...data.questions, [contentLang]: questions }, answers: data.answers })
  }

  const updateAnswer = (index, value) => {
    answers[index] = value
    updateQnA({ ...data, questions: data.questions, answers: { ...data.answers, [contentLang]: answers } })
  }

  const addQuestionAlternative = () => {
    questions.push('')
    questionKeys.current.push(_uniqueId())
    focusedElement.current = `question-${questions.length - 1}`
    updateQnA({ ...data, questions: { ...data.questions, [contentLang]: questions }, answers: data.answers })
  }

  const addAnswerAlternative = () => {
    answers.push('')
    answerKeys.current.push(_uniqueId())
    focusedElement.current = `answer-${answers.length - 1}`
    updateQnA({ ...data, questions: data.questions, answers: { ...data.answers, [contentLang]: answers } })
  }

  const onDelete = async () => {
    if (
      await confirmDialog(lang.tr('module.qna.form.confirmDeleteQuestion'), {
        acceptLabel: lang.tr('delete'),
        declineLabel: lang.tr('cancel')
      })
    ) {
      props.deleteQnA()
    }
  }

  const moreOptionsItems: MoreOptionsItems[] = [
    {
      label: lang.tr(data.enabled ? 'module.qna.form.disableQuestion' : 'module.qna.form.enableQuestion'),
      action: props.toogleEnabledQnA
    },
    {
      label: lang.tr('module.qna.form.deleteQuestion'),
      type: 'delete',
      action: onDelete
    }
  ]

  const onKeyDown = (e, index, type) => {
    if (e.key === 'Enter' && e.shiftKey) {
      e.preventDefault()
      type === 'question' ? addQuestionAlternative() : addAnswerAlternative()
    }
    if (
      e.key === 'Backspace' &&
      ((type === 'question' && questions.length > 1 && !questions[index].length) ||
        (type === 'answer' && answers.length > 1 && !answers[index].length))
    ) {
      e.preventDefault()

      if (type === 'question') {
        questions.splice(index, 1)
        questionKeys.current.splice(index, 1)
      } else {
        answerKeys.current.splice(index, 1)
        answers.splice(index, 1)
      }

      focusedElement.current = `${type}-${index === 0 ? 0 : index - 1}`

      updateQnA({
        ...data,
        questions: { ...data.questions, [contentLang]: questions },
        answers: { ...data.answers, [contentLang]: answers }
      })
    }
  }

  return (
    <div className={style.questionWrapper}>
      <div className={style.headerWrapper}>
        <Button minimal small onClick={() => setCollapsed(!collapsed)} className={style.questionHeader}>
          <div className={style.left}>
            <Icon icon={collapsed ? 'chevron-right' : 'chevron-down'} /> <h1>{questions?.[0]}</h1>
          </div>
          <div className={style.right}>{!data.enabled && <span className={style.tag}>Disabled</span>}</div>
        </Button>
        <MoreOptions show={showOption} onToggle={() => setShowOption(!showOption)} items={moreOptionsItems} />
      </div>
      {!collapsed && (
        <div className={style.collapsibleWrapper}>
          <div className={style.items}>
            <h2>Question</h2>
            {!!questions?.length &&
              questions?.map((question, index) => (
                <Textarea
                  key={questionKeys.current[index]}
                  isFocused={focusedElement.current === `question-${index}`}
                  className={style.textarea}
                  onChange={e => updateQuestion(index, e.currentTarget.value)}
                  onKeyDown={e => onKeyDown(e, index, 'question')}
                  value={question}
                />
              ))}
            <Button className={style.addBtn} minimal icon="plus" onClick={() => addQuestionAlternative()}>
              {lang.tr('module.qna.form.addQuestionAlternative')}
            </Button>
          </div>
          <div className={style.items}>
            <h2>Answer</h2>
            {!!answers?.length &&
              answers?.map((answer, index) => (
                <Textarea
                  key={answerKeys.current[index]}
                  isFocused={focusedElement.current === `answer-${index}`}
                  className={style.textarea}
                  onChange={e => updateAnswer(index, e.currentTarget.value)}
                  onKeyDown={e => onKeyDown(e, index, 'answer')}
                  value={answer}
                />
              ))}
            <Button className={style.addBtn} minimal icon="plus" onClick={() => addAnswerAlternative()}>
              {lang.tr('module.qna.form.addAnswerAlternative')}
            </Button>
            <Button className={style.addBtn} minimal icon="plus" onClick={() => addQuestionAlternative()}>
              {lang.tr('module.qna.form.addContent')}
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}

export default QnA
