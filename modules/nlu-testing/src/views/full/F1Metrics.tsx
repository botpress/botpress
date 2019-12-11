import { Classes, Colors, H3, H4, Label } from '@blueprintjs/core'
import React, { FC } from 'react'

import { F1, F1Metrics } from './api'
import style from './style.scss'

interface Props {
  f1Metrics: F1Metrics
}

const F1 = (props: { ctx: string; f1: F1 }) => (
  <div>
    <Label className={Classes.INTENT_PRIMARY}>{props.ctx}</Label>
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

export const F1s: FC<Props> = props => (
  <div className={style.f1Section}>
    <H4>F1 for Intents by contexts</H4>
    <div className={style.f1Container}>
      {Object.entries(props.f1Metrics).map(([ctx, f1]) => (
        <F1 f1={f1} ctx={ctx} />
      ))}
    </div>
  </div>
)
