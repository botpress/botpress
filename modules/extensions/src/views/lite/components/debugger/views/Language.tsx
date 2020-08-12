import React, { FC, Fragment } from 'react'

import style from '../style.scss'

interface Props {
  detectedLanguage: string
  usedLanguage: string
}

export const Language: FC<Props> = props => (
  <Fragment>
    <div className={style.section}>
      <h2 className={style.sectionTitle}>Detected language</h2>
      <p>{props.detectedLanguage}</p>
    </div>
  </Fragment>
)
