import { Button, Intent, Tag, TagInput } from '@blueprintjs/core'
import { NLU } from 'botpress/sdk'
import { lang } from 'botpress/shared'
import React, { FC } from 'react'

import style from './style.scss'

interface Props {
  occurrence: NLU.EntityDefOccurrence
  onChange: (o: NLU.EntityDefOccurrence) => void
  remove: () => void
}

export const Occurrence: FC<Props> = props => {
  return (
    <TagInput
      className={style.occurrence}
      leftIcon={
        <div className={style.occurrenceName}>
          <Tag minimal intent={Intent.PRIMARY}>
            <strong>{props.occurrence.name}</strong>
          </Tag>
        </div>
      }
      placeholder={lang.tr('nlu.entities.synonymPlaceholder')}
      rightElement={<Button icon="delete" minimal onClick={props.remove} />}
      onChange={(synonyms: string[]) => props.onChange({ ...props.occurrence, synonyms })}
      values={props.occurrence.synonyms}
      tagProps={{ minimal: true }}
    />
  )
}
