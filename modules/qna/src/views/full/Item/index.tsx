import { Button, Icon, Intent, Switch, Tooltip } from '@blueprintjs/core'
import { AccessControl } from 'botpress/utils'
import cx from 'classnames'
import React, { FC } from 'react'

import style from '../style.scss'

import RedirectInfo from './RedirectInfo'
import Variations from './Variations'

interface Props {
  id: string
  item: any
  contentLang: string
  // Hides category and redirect info
  isVersion2?: boolean
  onEditItem: (id: string) => void
  onDeleteItem: (id: string) => void
  onToggleItem: (item: any, id: string, checked: boolean) => void
}

const Item: FC<Props> = props => {
  if (!props.id || !props.item) {
    return null
  }

  const { id, item, contentLang } = props

  const questions = item.questions[contentLang] || []
  const answers = item.answers[contentLang] || []

  return (
    <div className={cx(style.qnaItem, style.well)} key={id}>
      <div className={style.itemContainer} role="entry">
        {!questions.length && (
          <div className={style.itemQuestions}>
            <a className={style.firstQuestionTitle} onClick={() => props.onEditItem(id)}>
              <Tooltip content="Missing translation">
                <Icon icon="warning-sign" intent={Intent.DANGER} />
              </Tooltip>
              &nbsp;
              {id
                .split('_')
                .slice(1)
                .join(' ')}{' '}
              &nbsp;
            </a>
          </div>
        )}

        {questions.length > 0 && (
          <div className={style.itemQuestions}>
            <span className={style.itemQuestionsTitle}>Q:</span>
            <a className={style.firstQuestionTitle} onClick={() => props.onEditItem(id)}>
              {questions[0]}
            </a>
            {<Variations elements={questions} />}
          </div>
        )}

        {answers[0] && (
          <div className={style.itemAnswerContainer}>
            <span className={style.itemAnswerTitle}>A:</span>
            <div className={style.itemAnswerText}>{answers[0]}</div>
            {<Variations elements={answers} />}
          </div>
        )}

        {!props.isVersion2 && (
          <div>
            <div className={style.itemRedirect}>
              {<RedirectInfo redirectFlow={item.redirectFlow} redirectNode={item.redirectNode} />}
            </div>
          </div>
        )}

        {item.category && !props.isVersion2 ? (
          <div className={style.questionCategory}>
            Category:{' '}
            <span className={style.questionCategoryTitle}>
              &nbsp;
              {item.category}
            </span>
          </div>
        ) : null}
      </div>

      <div className={style.itemAction}>
        <AccessControl resource="module.qna" operation="write">
          <Button
            icon="trash"
            className={style.itemActionDelete}
            onClick={() => props.onDeleteItem(id)}
            minimal={true}
          />
          <Switch
            checked={item.enabled}
            onChange={e => props.onToggleItem(item, id, e.currentTarget.checked)}
            large={true}
          />
        </AccessControl>
      </div>
    </div>
  )
}

export default Item
