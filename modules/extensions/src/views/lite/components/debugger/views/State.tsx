import { Button } from '@blueprintjs/core'
import * as sdk from 'botpress/sdk'
import cx from 'classnames'
import _ from 'lodash'
import React, { FC, Fragment, useEffect, useState } from 'react'

import Collapsible from '../../../../../../../../src/bp/ui-shared-lite/Collapsible'
import lang from '../../../../lang'
import style from '../style.scss'

import { Inspector } from './Inspector'

interface Props {
  state: sdk.IO.EventState
  prevState: sdk.IO.EventState
  isExpanded: (key: string) => boolean
  toggleExpand: (section: string, expanded: boolean) => void
}

const STATE_JSON = 'json::state'
const STATE_PANEL = 'panel::state'

const State: FC<Props> = ({ state, prevState, isExpanded, toggleExpand }) => {
  const [viewJSON, setViewJSON] = useState(isExpanded(STATE_JSON))

  useEffect(() => {
    setViewJSON(isExpanded(STATE_JSON))
  }, [isExpanded(STATE_JSON)])

  const toggleView = () => {
    const newValue = !viewJSON
    toggleExpand(STATE_JSON, newValue)
    setViewJSON(newValue)
  }

  const variables = state.session.workflows?.[state.session.currentWorkflow]?.variables || {}
  const prevVariables = prevState?.session.workflows?.[state.session.currentWorkflow]?.variables || {}
  const variableIds = _.uniq([...Object.keys(variables), ...Object.keys(prevVariables)])

  const renderContent = () => {
    if (viewJSON || !variableIds.length) {
      return <Inspector className={cx({ [style.inspectorSpacing]: !variableIds.length })} data={state} />
    }

    return (
      <table className={cx(style.variablesTable, 'bp3-html-table .modifier')}>
        <thead>
          <tr>
            <th>{lang.tr('module.extensions.state.variable')}</th>
            <th>{lang.tr('module.extensions.state.valueBefore')}</th>
            <th>{lang.tr('module.extensions.state.valueAfter')}</th>
          </tr>
        </thead>
        <tbody>
          {variableIds.map(variableId => (
            <tr>
              <td>{variableId}</td>
              <td>{prevVariables[variableId]?.value || lang.tr('module.extensions.state.undefined')}</td>
              <td>{variables[variableId]?.value || lang.tr('module.extensions.state.undefined')}</td>
            </tr>
          ))}
        </tbody>
      </table>
    )
  }

  return (
    <Collapsible
      opened={isExpanded(STATE_PANEL)}
      toggleExpand={expanded => toggleExpand(STATE_PANEL, expanded)}
      name={lang.tr('module.extensions.summary.state')}
    >
      {renderContent()}
      {!!variableIds.length && (
        <Button minimal className={style.switchViewBtn} icon="eye-open" onClick={toggleView}>
          {viewJSON ? lang.tr('module.extensions.viewAsSummary') : lang.tr('module.extensions.viewAsJson')}
        </Button>
      )}
    </Collapsible>
  )
}

export default State
