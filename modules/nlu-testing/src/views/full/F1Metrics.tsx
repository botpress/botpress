import { Colors, H3, H4, Label } from '@blueprintjs/core'
import _ from 'lodash'
import React, { FC } from 'react'

import { F1, XValidationResults } from './api'
import style from './style.scss'

interface Props {
  f1Metrics: XValidationResults
}

const F1 = (props: { label?: string; f1: F1 }) => (
  <div>
    {!!props.label && <Label style={{ color: Colors.GRAY1 }}>{props.label}</Label>}
    <ul>
      <li>
        <strong>F1:</strong>
        {props.f1['f1']}
      </li>
      <li>
        <strong>Precision:</strong>
        {props.f1['precision']}
      </li>
      <li>
        <strong>Recall:</strong>
        {props.f1['recall']}
      </li>
    </ul>
  </div>
)

export const CrossValidationResults: FC<Props> = props => {
  if (_.isEmpty(props.f1Metrics.slots) && _.isEmpty(props.f1Metrics.intents)) {
    return null
  } else
    return (
      <div className={style.f1Section}>
        <H3>Cross Validation Results</H3>
        <H4>Intents per contexts</H4>
        <div className={style.f1Container}>
          {Object.entries(props.f1Metrics.intents).map(([ctx, f1]) => (
            <F1 f1={f1} label={ctx == 'all' ? 'combined contexts' : ctx} />
          ))}
        </div>
        {!_.isEmpty(props.f1Metrics.slots) && (
          <React.Fragment>
            <H4>Slots</H4>
            <div className={style.f1Container}>
              <F1 f1={props.f1Metrics.slots} />
            </div>
          </React.Fragment>
        )}
      </div>
    )
}
