import { Icon } from '@blueprintjs/core'
import * as sdk from 'botpress/sdk'
import _ from 'lodash'
import React, { FC, Fragment } from 'react'

import lang from '../../../../lang'
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
                    {lang.tr('module.extensions.actions.say', { x: (data as sdk.NDU.SendContent).sourceDetails })}
                  </span>
                )
              case 'startWorkflow':
                return (
                  <span key={index} className={style.truncate}>
                    {lang.tr('module.extensions.actions.startWorkflow', { x: (data as sdk.NDU.FlowRedirect).flow })}
                  </span>
                )
              case 'goToNode':
                return (
                  <span key={index} className={style.truncate}>
                    {lang.tr('module.extensions.actions.goToNode', { x: (data as sdk.NDU.FlowRedirect).node })}
                  </span>
                )
              case 'redirect':
                return (
                  <span key={index} className={style.truncate}>
                    {lang.tr('module.extensions.actions.redirectTo', { x: (data as sdk.NDU.FlowRedirect).flow })}
                  </span>
                )
              case 'continue':
                return <span key={index}>{lang.tr('module.extensions.actions.continue')}</span>
              case 'prompt.cancel':
                return <span key={index}>{lang.tr('module.extensions.actions.cancelPrompt')}</span>
              case 'prompt.inform':
                return <span key={index}>{lang.tr('module.extensions.actions.informPrompt')}</span>
            }
          })}
        </li>
      </ul>
    </Fragment>
  )
}
