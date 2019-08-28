import { Colors, H5, Pre } from '@blueprintjs/core'
import * as sdk from 'botpress/sdk'
import React, { FC } from 'react'
import JSONTree from 'react-json-tree'

import inspectorTheme from '../inspectorTheme'
import style from '../style.scss'

export const Error: FC<{ error: sdk.IO.EventError }> = ({ error }) => {
  return (
    <div>
      {error.type === 'action-execution' && (
        <div className={style.subSection}>
          <H5 color={Colors.DARK_GRAY5}>Error executing action "{error.actionName}"</H5>
          <H5 color={Colors.DARK_GRAY5}>Arguments</H5>
          <Pre className={style.inspectorContainer}>
            <div className={style.inspector}>
              <JSONTree
                data={error.actionArgs || {}}
                theme={inspectorTheme}
                invertTheme={true}
                hideRoot={true}
                shouldExpandNode={() => true}
              />
            </div>
          </Pre>
        </div>
      )}
      <br />
      {error.stacktrace && (
        <div>
          <H5 color={Colors.DARK_GRAY5}>Stack trace</H5>
          <Pre className={style.stacktrace}>{error.stacktrace}</Pre>
        </div>
      )}
    </div>
  )
}
