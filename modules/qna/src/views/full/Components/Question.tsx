import { Button } from '@blueprintjs/core'
import { lang, MoreOptions, Textarea } from 'botpress/shared'
import cx from 'classnames'
import React, { FC, useState } from 'react'

import { MoreOptionsItems } from '../../../../../../src/bp/ui-shared/src/MoreOptions/typings'
import style from '../style.scss'

interface Props {
  question: any
  contentLang: string
  updateQnA: (questions: any) => void
  deleteQuestion: () => void
}

const Question: FC<Props> = props => {
  const [showOption, setShowOption] = useState(false)
  const [collapsed, setCollapsed] = useState(true)
  const {
    contentLang,
    question: { data },
    updateQnA
  } = props

  const questions = data.questions[contentLang]
  const answers = data.answers[contentLang]

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
    updateQnA({ ...data, questions: { ...data.questions, [contentLang]: questions }, answers: data.answers })
  }
  const addAnswerAlternative = () => {
    answers.push('')
    updateQnA({ ...data, questions: data.questions, answers: { ...data.answers, [contentLang]: answers } })
  }

  const moreOptionsItems: MoreOptionsItems[] = [
    {
      label: lang.tr(data.enabled ? 'module.qna.form.disableQuestion' : 'module.qna.form.enableQuestion'),
      action: () => {}
    },
    {
      label: lang.tr('module.qna.form.deleteQuestion'),
      type: 'delete',
      action: props.deleteQuestion
    }
  ]

  const onKeyDown = (e, index, type) => {
    console.log(e.key)
    if (
      e.key === 'Backspace' &&
      ((type === 'question' && !questions[index].length) || (type === 'answer' && !answers[index].length))
    ) {
      type === 'question' ? questions.splice(index, 1) : answers.splice(index, 1)
      updateQnA({
        ...data,
        questions: { ...data.questions, [contentLang]: questions },
        answers: { ...data.answers, [contentLang]: answers }
      })
    }
  }

  return (
    <div
      className={cx(style.questionWrapper, { [style.collapsed]: collapsed })}
      onClick={() => collapsed && setCollapsed(!collapsed)}
    >
      <div className={style.questionHeader}>
        <div className={style.left}>
          <Button
            minimal
            small
            icon={collapsed ? 'chevron-right' : 'chevron-down'}
            onClick={() => setCollapsed(!collapsed)}
          ></Button>
          <h1>{questions?.[0]}</h1>
        </div>
        <div className={style.right}>
          <MoreOptions show={showOption} onToggle={() => setShowOption(!showOption)} items={moreOptionsItems} />
        </div>
      </div>
      {!collapsed && (
        <div className={style.collapsibleWrapper}>
          <div className={style.items}>
            <h2>Question</h2>
            {!!questions?.length &&
              questions?.map((question, index) => (
                <Textarea
                  key={index}
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
                  key={index}
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

export default Question
