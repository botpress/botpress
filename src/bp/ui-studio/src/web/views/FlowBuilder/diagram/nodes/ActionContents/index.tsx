import { parseActionInstruction } from 'common/action'
import { ActionServer } from 'common/typings'
import React, { FC, Fragment } from 'react'

import { BlockProps } from '../Block'
import style from '../Components/style.scss'

export const ActionInfo: FC<{ action: Action }> = ({ action }) => {
  if (!action.name || !action.actionServerId) {
    return <Fragment>No action chosen</Fragment>
  }

  return (
    <Fragment>
      {action?.name} ({action?.actionServerId})
    </Fragment>
  )
}

type Props = Pick<BlockProps, 'node' | 'editNodeItem'>

const ActionContents: FC<Props> = ({ node, editNodeItem }) => (
  <div className={style.contentsWrapper}>
    <div className={style.contentWrapper} onClick={() => editNodeItem(node, 0)}>
      <div className={style.content}>
        <ActionInfo action={parseActionString(node.onEnter[0])} />
      </div>
    </div>
  </div>
)

type PropType<TObj, TProp extends keyof TObj> = TObj[TProp]

export interface Parameters {
  [name: string]: string
}

export interface Action {
  name: string
  parameters: Parameters
  actionServerId: PropType<ActionServer, 'id'>
}

export const parseActionString = (actionString: string | undefined): Action => {
  let name = ''
  let parameters = {}
  let actionServerId = ''

  if (actionString) {
    const result = parseActionInstruction(actionString)
    name = result.actionName

    const parametersString = result.argsStr
    parameters = JSON.parse(parametersString)

    actionServerId = result.actionServerId
  }

  return { name, parameters, actionServerId }
}

export default ActionContents
