import React, { FC, Fragment, useState } from 'react'

import lang from '../../../../lang'
import style from '../style.scss'

interface Props {
  detectedLanguage: string
  usedLanguage: string
}

export const Language: FC<Props> = props => (
  <Fragment>
    <div className={style.section}>
      <h2 className={style.sectionTitle}>{lang.tr('module.extensions.detectedLanguage')}</h2>
      <p>{props.detectedLanguage}</p>
    </div>
    <div className={style.section}>
      <h2 className={style.sectionTitle}>{lang.tr('module.extensions.usedLanguage')}</h2>
      <p>{props.usedLanguage}</p>
    </div>
  </Fragment>
)
