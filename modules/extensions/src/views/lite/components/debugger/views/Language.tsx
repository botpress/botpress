import React, { FC } from 'react'

import ContentSection from '../../../../../../../../src/bp/ui-shared-lite/ContentSection'
import lang from '../../../../lang'

interface Props {
  detectedLanguage: string
  usedLanguage: string
}

export const Language: FC<Props> = props => (
  <ContentSection title={lang.tr('module.extensions.detectedLanguage')}>
    <p>{props.detectedLanguage === 'n/a' ? lang.tr('notAvailable') : props.detectedLanguage}</p>
  </ContentSection>
)
