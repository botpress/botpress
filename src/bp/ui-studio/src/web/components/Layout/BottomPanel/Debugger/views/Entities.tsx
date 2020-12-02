import { HTMLTable } from '@blueprintjs/core'
import * as sdk from 'botpress/sdk'
import { lang } from 'botpress/shared'
import React, { FC, Fragment } from 'react'

import style from '../style.scss'

export const Entities: FC<{ entities: sdk.NLU.Entity[] }> = props => (
  <Fragment>
    <HTMLTable condensed className={style.summaryTable}>
      <thead>
        <tr>
          <th>{lang.tr('bottomPanel.debugger.entities.type')}</th>
          <th>{lang.tr('bottomPanel.debugger.entities.source')}</th>
          <th>{lang.tr('bottomPanel.debugger.entities.normalizedValue')}</th>
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
