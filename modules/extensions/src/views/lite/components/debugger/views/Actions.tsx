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
          {actions.map(({ action, data }, index) => {
            switch (action) {
              case 'send':
                return (
                  <span key={index} className={style.truncate}>
                    Say {(data as sdk.NDU.SendContent).sourceDetails}
                  </span>
                )
              case 'startWorkflow':
                return (
                  <span key={index} className={style.truncate}>
                    Start Workflow {(data as sdk.NDU.FlowRedirect).flow}
                  </span>
                )
              case 'goToNode':
                return (
                  <span key={index} className={style.truncate}>
                    Go to node {(data as sdk.NDU.FlowRedirect).node}
                  </span>
                )
              case 'redirect':
                return (
                  <span key={index} className={style.truncate}>
                    Redirect to {(data as sdk.NDU.FlowRedirect).flow}
                  </span>
                )
              case 'continue':
                return <span key={index}>Continue</span>
              case 'prompt.cancel':
                return <span key={index}>Cancel Prompt</span>
              case 'prompt.inform':
                return <span key={index}>Inform Prompt</span>
            }
          })}
        </li>
      </ul>
    </Fragment>
  )
}
