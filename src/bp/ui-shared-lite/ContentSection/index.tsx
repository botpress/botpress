// @ts-nocheck
import cx from 'classnames'
import React, { FC } from 'react'

import style from './style.scss'
import { ContentSectionProps } from './typings'

const ContentSection: FC<ContentSectionProps> = ({ children, title }) => (
  <div className={cx(style.section, 'section')}>
    {title && <h2 className={style.sectionTitle}>{title}</h2>}
    {children}
  </div>
)

export default ContentSection
