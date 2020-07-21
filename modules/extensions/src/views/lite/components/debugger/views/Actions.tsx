import { Icon } from '@blueprintjs/core'
import * as sdk from 'botpress/sdk'
import _ from 'lodash'
import React, { FC, Fragment } from 'react'

import style from '../style.scss'

interface Props {
  ndu: sdk.NDU.DialogUnderstanding
}

export const Actions: FC<Props> = props => {
  const { actions } = props.ndu

  return (
    <Fragment>
      <ul>
        <li>
          {actions.map(({ action, data }) => {
            switch (action) {
              case 'send':
                return <span className={style.truncate}>Say {(data as sdk.NDU.SendContent).sourceDetails}</span>
              case 'startWorkflow':
                return <span className={style.truncate}>Start Workflow {(data as sdk.NDU.FlowRedirect).flow}</span>
              case 'goToNode':
                return <span className={style.truncate}>Go to node {(data as sdk.NDU.FlowRedirect).node}</span>
              case 'redirect':
                return <span className={style.truncate}>Redirect to {(data as sdk.NDU.FlowRedirect).flow}</span>
              case 'continue':
                return <span>Continue</span>
            }
          })}
        </li>
      </ul>
    </Fragment>
  )
}
