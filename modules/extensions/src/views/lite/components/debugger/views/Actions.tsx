import { Colors, H5, HTMLTable, Icon } from '@blueprintjs/core'
import * as sdk from 'botpress/sdk'
import _ from 'lodash'
import React, { FC } from 'react'

import style from '../style.scss'

interface Props {
  ndu: sdk.NDU.DialogUnderstanding
}

export const Actions: FC<Props> = props => {
  const { actions } = props.ndu

  return (
    <div className={style.subSection}>
      <div style={{ display: 'flex' }}>
        <div>
          {actions.map(({ action, data }) => {
            switch (action) {
              case 'send':
                return (
                  <div className={style.truncate}>
                    <Icon icon="chat" /> Say {(data as sdk.NDU.SendContent).sourceDetails}
                  </div>
                )
              case 'startWorkflow':
                return (
                  <div className={style.truncate}>
                    <Icon icon="flow-linear" /> Start Workflow {(data as sdk.NDU.FlowRedirect).flow}
                  </div>
                )
              case 'goToNode':
                return (
                  <div className={style.truncate}>
                    <Icon icon="flow-linear" /> Go to node {(data as sdk.NDU.FlowRedirect).node}
                  </div>
                )
              case 'redirect':
                return (
                  <div className={style.truncate}>
                    <Icon icon="pivot" /> Redirect to {(data as sdk.NDU.FlowRedirect).flow}
                  </div>
                )
              case 'continue':
                return (
                  <div>
                    <Icon icon="play" /> Continue
                  </div>
                )
            }
          })}
        </div>
      </div>
    </div>
  )
}
