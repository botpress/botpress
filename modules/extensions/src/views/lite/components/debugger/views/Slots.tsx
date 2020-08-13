import { HTMLTable, Tooltip } from '@blueprintjs/core'
import * as sdk from 'botpress/sdk'
import _ from 'lodash'
import React, { Fragment, SFC } from 'react'

import lang from '../../../../lang'
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
                content={lang.tr('module.extensions.slots.value', { x: s.value })}
                position={'top'}
              >
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
        <Tooltip content={lang.tr('module.extensions.slots.value', { x: slot.value })}>
          <span style={{ textDecoration: 'underline' }}>{slot.source}</span>
        </Tooltip>
      </td>
      <td>
        {slot.turns
          ? lang.tr('module.extensions.slots.turnsAgo', { x: slot.value })
          : lang.tr('module.extensions.slots.thisTurn')}
      </td>
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
    <Fragment>
      <HTMLTable condensed>
        <thead>
          <tr>
            <th>{lang.tr('module.extensions.slots.slot')}</th>
            <th>{lang.tr('module.extensions.slots.source')}</th>
            <th>{lang.tr('module.extensions.slots.extracted')}</th>
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
    </Fragment>
  )
}
