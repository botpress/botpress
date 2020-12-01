import React, { FC } from 'react'

import style from '../style.scss'

interface Props {
  detectedLanguage: string
  usedLanguage: string
}

export const Language: FC<Props> = props => (
  <div>
    <p>
      <span className={style.slightBold}>Detected language:</span>&nbsp;
      <span>{props.detectedLanguage}</span>
    </p>
    <p>
      <span className={style.slightBold}>Used Language:</span>&nbsp;
      <span>{props.usedLanguage}</span>
    </p>
  </div>
)
