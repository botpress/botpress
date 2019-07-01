import { Colors, H5, HTMLTable } from '@blueprintjs/core'
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
              <li>{s.source}</li>
            ))}
          </ul>
        </td>
        <td>
          <ul>
            {slot.map(s => (
              <li>{s.value}</li>
            ))}
          </ul>
        </td>
      </tr>
    )
  }

  return (
    <tr>
      <td>{name}</td>
      <td>{slot.source}</td>
      <td>{slot.value}</td>
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
      <H5 color={Colors.DARK_GRAY5}>Slots</H5>
      <HTMLTable condensed className={style.summaryTable}>
        <thead>
          <tr>
            <th>Slot</th>
            <th>Source</th>
            <th>Value</th>
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
