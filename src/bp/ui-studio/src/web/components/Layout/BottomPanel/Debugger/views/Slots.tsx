import { HTMLTable, Tooltip } from '@blueprintjs/core'
import * as sdk from 'botpress/sdk'
import { lang } from 'botpress/shared'
import _ from 'lodash'
import React, { FC } from 'react'

import style from '../style.scss'

const renderSlotItem = (name: string, slot: any) => {
  if (_.isArray(slot)) {
    return (
      <tr>
        <td>{name}</td>
        <td>
          <ul>
            {slot.map(s => (
              <Tooltip
                key={s.value}
                content={lang.tr('bottomPanel.debugger.slots.value', { x: s.value })}
                position="top"
              >
                <li className={style.underline}>{s.source}</li>
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
        <Tooltip content={lang.tr('bottomPanel.debugger.slots.value', { x: slot.value })}>
          <span className={style.underline}>{slot.source}</span>
        </Tooltip>
      </td>
      <td>
        {slot.turns
          ? lang.tr('bottomPanel.debugger.slots.turnsAgo', { x: slot.turns })
          : lang.tr('bottomPanel.debugger.slots.thisTurn')}
      </td>
    </tr>
  )
}

interface Props {
  slots: sdk.NLU.SlotCollection
  sessionSlots: any | undefined
}

export const Slots: FC<Props> = props => {
  if (_.isEmpty(props.sessionSlots) && _.isEmpty(props.slots)) {
    return null
  }

  return (
    <HTMLTable condensed className={style.summaryTable}>
      <thead>
        <tr>
          <th>{lang.tr('bottomPanel.debugger.slots.slot')}</th>
          <th>{lang.tr('bottomPanel.debugger.slots.source')}</th>
          <th>{lang.tr('bottomPanel.debugger.slots.extracted')}</th>
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
  )
}
