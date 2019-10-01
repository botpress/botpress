import { Button, Collapse, Colors, H5, H6, Pre } from '@blueprintjs/core'
import * as sdk from 'botpress/sdk'
import _ from 'lodash'
import React, { FC, useState } from 'react'
import JSONTree from 'react-json-tree'

import inspectorTheme from '../inspectorTheme'
import style from '../style.scss'

export const Error: FC<{ error: sdk.IO.EventError }> = ({ error }) => {
  const [showStack, setShowStack] = useState(false)
  const message = _.first(error.stacktrace && error.stacktrace.split('\n'))

  return (
    <div>
      {error.type === 'action-execution' && (
        <div className={style.subSection}>
          <H5 color={Colors.DARK_GRAY5}>Error executing action "{error.actionName}"</H5>
          <p style={{ margin: 15 }}>{message}</p>
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
      {error.type === 'dialog-transition' && (
        <div className={style.subSection}>
          <H5 color={Colors.DARK_GRAY5}>Error during transition to "{error.destination}"</H5>
        </div>
      )}
      <br />
      {error.stacktrace && (
        <div>
          <H5 color={Colors.DARK_GRAY5}>
            <Button
              onClick={() => setShowStack(!showStack)}
              text="Stack trace"
              rightIcon={showStack ? 'chevron-down' : 'chevron-up'}
              minimal={true}
            />
          </H5>
          <Collapse isOpen={showStack}>
            <Pre className={style.stacktrace}>{error.stacktrace}</Pre>
          </Collapse>
        </div>
      )}
    </div>
  )
}
