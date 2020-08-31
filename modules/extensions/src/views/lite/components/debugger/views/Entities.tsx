import { HTMLTable } from '@blueprintjs/core'
import * as sdk from 'botpress/sdk'
import React, { Fragment, SFC } from 'react'

import lang from '../../../../lang'

export const Entities: SFC<{ entities: sdk.NLU.Entity[] }> = props => (
  <Fragment>
    <HTMLTable condensed>
      <thead>
        <tr>
          <th>{lang.tr('module.extensions.entities.type')}</th>
          <th>{lang.tr('module.extensions.entities.source')}</th>
          <th>{lang.tr('module.extensions.entities.normalizedValue')}</th>
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
