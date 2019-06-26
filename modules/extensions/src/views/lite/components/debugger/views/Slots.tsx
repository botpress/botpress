import { Colors, H5, HTMLTable } from '@blueprintjs/core'
import * as sdk from 'botpress/sdk'
import _ from 'lodash'
import React, { SFC } from 'react'

import style from '../style.scss'

const renderSlotItem = (slot: sdk.NLU.Slot | sdk.NLU.Slot[]) => {
  if (_.isArray(slot)) {
    return (
      <React.Fragment>
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
      </React.Fragment>
    )
  }

  return (
    <React.Fragment>
      <td>{slot.source}</td>
      <td>{slot.value}</td>
    </React.Fragment>
  )
}

export const Slots: SFC<{ slots: sdk.NLU.SlotCollection }> = props => (
  <div className={style.subSection}>
    <H5 color={Colors.DARK_GRAY5}>Slots</H5>
    <HTMLTable condensed className={style.summaryTable}>
      <thead>
        <tr>
          <th>Slot</th>
          <th>Source</th>
          <th>Value</th>
        </tr>
      </thead>
      <tbody>
        {Object.entries(props.slots).map(([name, slot]) => (
          <tr>
            <td>{name}</td>
            {renderSlotItem(slot)}
          </tr>
        ))}
      </tbody>
    </HTMLTable>
  </div>
)

// export const Slots = props => {
//   const { slots } = props

//   return (
//     <div className={style.subSection}>
//       <H5 color={Colors.DARK_GRAY5}>Slots</H5>
//       <ul>
//         {Object.keys(slots).map((key, idx) => {
//           const res = _.isArray(slots[key]) ? slots[key].map(s => s.value).join(',') : slots[key].value
//           return (
//             <li key={key + idx}>
//               {key}: {res}
//             </li>
//           )
//         })}
//       </ul>
//     </div>
//   )
// }
