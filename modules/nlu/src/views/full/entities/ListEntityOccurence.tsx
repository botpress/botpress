import { Button, Intent, Tag, TagInput } from '@blueprintjs/core'
import { NLU } from 'botpress/sdk'
import React, { FC } from 'react'

import style from './style.scss'

interface Props {
  occurence: NLU.EntityDefOccurence
  onChange: (o: NLU.EntityDefOccurence) => void
  remove: () => void
}

export const Occurence: FC<Props> = props => {
  return (
    <TagInput
      className={style.occurence}
      leftIcon={
        <div className={style.occurenceName}>
          <Tag minimal intent={Intent.PRIMARY}>
            <strong>{props.occurence.name}</strong>
          </Tag>
        </div>
      }
      placeholder="Type a synonym (or more, comma seperated) and hit enter"
      rightElement={<Button icon="delete" minimal onClick={props.remove} />}
      onChange={(synonyms: string[]) => props.onChange({ ...props.occurence, synonyms })}
      values={props.occurence.synonyms}
      tagProps={{ minimal: true }}
    />
  )
}
