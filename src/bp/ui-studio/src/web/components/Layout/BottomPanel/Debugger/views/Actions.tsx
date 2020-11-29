import { Icon } from '@blueprintjs/core'
import * as sdk from 'botpress/sdk'
import { ContentSection, lang } from 'botpress/shared'
import _ from 'lodash'
import React, { FC } from 'react'

import style from '../style.scss'

interface Props {
  ndu: sdk.NDU.DialogUnderstanding
}

export const Actions: FC<Props> = props => {
  const { actions } = props.ndu

  return (
    <ContentSection title={lang.tr('actions')} className={style.section}>
      <ul>
        <li>
          {actions.map(({ action, data }, index) => {
            switch (action) {
              case 'send':
                return (
                  <span key={index} className={style.truncate}>
                    {lang.tr('bottomPanel.debugger.actions.say', {
                      x: (data as sdk.NDU.SendContent).sourceDetails
                    })}
                  </span>
                )
              case 'startWorkflow':
                return (
                  <span key={index} className={style.truncate}>
                    {lang.tr('bottomPanel.debugger.actions.startWorkflow', {
                      x: (data as sdk.NDU.FlowRedirect).flow
                    })}
                  </span>
                )
              case 'goToNode':
                return (
                  <span key={index} className={style.truncate}>
                    {lang.tr('bottomPanel.debugger.actions.goToNode', {
                      x: (data as sdk.NDU.FlowRedirect).node
                    })}
                  </span>
                )
              case 'redirect':
                return (
                  <span key={index} className={style.truncate}>
                    {lang.tr('bottomPanel.debugger.actions.redirectTo', {
                      x: (data as sdk.NDU.FlowRedirect).flow
                    })}
                  </span>
                )
              case 'continue':
                return <span key={index}>{lang.tr('bottomPanel.debugger.actions.continue')}</span>
            }
          })}
        </li>
      </ul>
    </ContentSection>
  )
}
