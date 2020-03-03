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
  isLite?: boolean
  onEditItem: (id: string) => void
  onDeleteItem: (id: string) => void
  onToggleItem: (item: any, id: string, checked: boolean) => void
}

const Item: FC<Props> = props => {
  if (!props.id || !props.item) {
    return null
  }

  const { id, item, contentLang, last, isLite } = props

  const questions = item.questions[contentLang] || []
  const answers = item.answers[contentLang] || []
  const missingTranslations = !questions.length || (item.action !== ACTIONS.REDIRECT && !answers.length)

  return (
    <div className={cx(style.questionTableRow, { [style.last]: last })} key={id}>
      <div className={cx(style.questionTableCell, style.question)}>
        {missingTranslations && (
          <Fragment>
            <Tooltip content="Missing translation">
              <Icon icon="warning-sign" intent={Intent.DANGER} />
            </Tooltip>
            &nbsp;
            {id
              .split('_')
              .slice(1)
              .join(' ')}{' '}
          </Fragment>
        )}
        {!missingTranslations && (
          <Fragment>
            {questions[0]}
            {<Variations isLite={isLite} elements={questions} />}
          </Fragment>
        )}
      </div>

      <div className={style.questionTableCell}>
        {answers[0] && (
          <Fragment>
            {answers[0]}
            {<Variations isLite={isLite} elements={answers} />}
          </Fragment>
        )}
      </div>

      {!isLite && <div className={style.questionTableCell}>{item.category && item.category}</div>}

      {!isLite && (
        <div className={cx(style.questionTableCell, style.redirect)}>
          <RedirectInfo
            id={props.id}
            redirectFlow={item.redirectFlow}
            redirectNode={item.redirectNode}
            flows={props.flows}
            onEditItem={props.onEditItem}
          />
        </div>
      )}

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
