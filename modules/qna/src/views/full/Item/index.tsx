import { Button, Icon, Intent, Switch, Tooltip } from '@blueprintjs/core'
import { Flow } from 'botpress/sdk'
import { AccessControl } from 'botpress/utils'
import cx from 'classnames'
import React, { FC, Fragment } from 'react'

import style from '../style.scss'
import { ACTIONS } from '../Editor'

import RedirectInfo from './RedirectInfo'
import Variations from './Variations'

interface Props {
  id: string
  item: any
  contentLang: string
  last?: boolean
  flows?: Flow[]
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

  const { id, item, contentLang, last } = props

  const questions = item.questions[contentLang] || []
  const answers = item.answers[contentLang] || []
  const missingTranslations = !questions.length || (item.action !== ACTIONS.REDIRECT && !answers.length)
  console.log(last)
  return (
    <div className={cx(style.questionTableRow, { [style.last]: last })} key={id}>
      <div className={style.questionTableCell}>
        {missingTranslations && (
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
        )}
        {!missingTranslations && (
          <Fragment>
            <a className={style.firstQuestionTitle} onClick={() => props.onEditItem(id)}>
              {questions[0]}
            </a>
            {<Variations elements={questions} />}
          </Fragment>
        )}
      </div>

      <div className={style.questionTableCell}>
        {answers[0] && (
          <div className={style.itemAnswerText}>
            {answers[0]}
            {<Variations elements={answers} />}
          </div>
        )}
      </div>

      <div className={style.questionTableCell}>
        {item.category && !props.isVersion2 ? (
          <span className={style.questionCategoryTitle}>{item.category}</span>
        ) : null}
      </div>

      <div className={cx(style.questionTableCell, style.redirect)}>
        {!props.isVersion2 && (
          <RedirectInfo
            id={props.id}
            redirectFlow={item.redirectFlow}
            redirectNode={item.redirectNode}
            flows={props.flows}
            onEditItem={props.onEditItem}
          />
        )}
      </div>

      <div className={cx(style.questionTableCell, style.actions)}>
        <div className={style.itemAction}>
          <AccessControl resource="module.qna" operation="write">
            <Switch checked={item.enabled} onChange={e => props.onToggleItem(item, id, e.currentTarget.checked)} />
            <Button icon="edit" onClick={() => props.onEditItem(id)} minimal />
            <Button icon="trash" intent="danger" onClick={() => props.onDeleteItem(id)} minimal />
          </AccessControl>
        </div>
      </div>
    </div>
  )
}

export default Item
