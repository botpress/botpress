import { Colors, H5, HTMLTable, Tooltip } from '@blueprintjs/core'
import * as sdk from 'botpress/sdk'
import _ from 'lodash'
import React, { SFC } from 'react'

import style from '../style.scss'

const renderSlotItem = (name: string, slot: any) => {
  if (_.isArray(slot)) {
    return (
      <tr>
        <td>{name}</td>
        <td>
          <ul>
            {slot.map(s => (
              <Tooltip key={s.value} content={`Value: ${s.value}`} position={'top'}>
                <li style={{ textDecoration: 'underline' }}>{s.source}</li>
              </Tooltip>
            ))}
          </ul>
        </td>
      </tr>
    )
  }

  return (
    <tr>
      <td>{name}</td>
      <td>
        <Tooltip content={`Value: ${slot.value}`}>
          <span style={{ textDecoration: 'underline' }}>{slot.source}</span>
        </Tooltip>
      </td>
      <td>{slot.turns ? `${slot.turns} turns ago` : 'This turn'} </td>
    </tr>
  )
}

interface Props {
  slots: sdk.NLU.SlotCollection
  sessionSlots: any | undefined
}

export const Slots: SFC<Props> = props => {
  if (_.isEmpty(props.sessionSlots) && _.isEmpty(props.slots)) {
    return null
  }

  return (
    <div className={style.subSection}>
      <HTMLTable condensed className={style.summaryTable}>
        <thead>
          <tr>
            <th>Slot</th>
            <th>Source</th>
            <th>Extracted</th>
          </tr>
        </thead>
        <tbody>
          {props.slots && Object.entries(props.slots).map(([name, slot]) => renderSlotItem(name, slot))}
          {props.sessionSlots &&
            _.chain(props.sessionSlots)
              .omit('notFound')
              .entries()
              .map(([name, slot]) => !props.slots[name] && renderSlotItem(name, slot))
              .value()}
        </tbody>
      </HTMLTable>
    </div>
  )
}
