import { Colors, H5, HTMLTable } from '@blueprintjs/core'
import React, { FC } from 'react'

import style from '../style.scss'

interface Props {
  detectedLanguage: string
  usedLanguage: string
}

export const Language: FC<Props> = props => (
  <div className={style.subSection}>
    <div className={style.language}>
      <p>
        <strong>Detected language:</strong>&nbsp;
        <span>{props.detectedLanguage}</span>
      </p>
      <p>
        <strong>Used Language:</strong>&nbsp;
        <span>{props.usedLanguage}</span>
      </p>
    </div>
  </div>
)
