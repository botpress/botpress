import { HTMLTable } from '@blueprintjs/core'
import * as sdk from 'botpress/sdk'
import React, { Fragment, SFC } from 'react'

export const Entities: SFC<{ entities: sdk.NLU.Entity[] }> = props => (
  <Fragment>
    <HTMLTable condensed>
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
  </Fragment>
)
