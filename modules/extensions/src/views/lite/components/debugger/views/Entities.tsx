import { Colors, H5, HTMLTable } from '@blueprintjs/core'
import * as sdk from 'botpress/sdk'
import React, { SFC } from 'react'

import style from '../style.scss'

export const Entities: SFC<{ entities: sdk.NLU.Entity[] }> = props => (
  <div className={style.subSection}>
    <H5 color={Colors.DARK_GRAY5}>Entities</H5>
    <HTMLTable condensed className={style.summaryTable}>
      <thead>
        <tr>
          <th>Type</th>
          <th>Source</th>
          <th>Normalized Value</th>
        </tr>
      </thead>
      <tbody>
        {props.entities.map(entity => (
          <tr key={entity.name}>
            <td>{entity.name}</td>
            <td>
              <span>{entity.meta.source}</span>
            </td>
            <td>
              {/** TODO: remove the unit in the backend when not required  */}
              {entity.data.value}&nbsp;{entity.data.unit !== 'string' && entity.data.unit}
            </td>
          </tr>
        ))}
      </tbody>
    </HTMLTable>
  </div>
)
