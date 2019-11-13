import { Button, Checkbox, Colors, FormGroup, Icon, InputGroup, Label, Position, Tooltip } from '@blueprintjs/core'
import { NLU } from 'botpress/sdk'
import _ from 'lodash'
import React, { useEffect, useState } from 'react'

import style from './style.scss'
import { Occurence } from './ListEntityOccurence'

interface Props {
  entity: NLU.EntityDefinition
  updateEntity: (entity: NLU.EntityDefinition) => void
}

export const ListEntityEditor: React.FC<Props> = props => {
  const [sensitive, setSensitive] = useState<boolean>(props.entity.sensitive)
  const [newOccurence, setNewOccurence] = useState<string>('')
  const [occurences, setOccurences] = useState<NLU.EntityDefOccurence[]>(props.entity.occurences)

  useEffect(() => {
    const newEntity = { ...props.entity, sensitive, occurences }
    if (!_.isEqual(newEntity, props.entity)) {
      props.updateEntity(newEntity)
    }
  }, [occurences, sensitive])

  const addOccurance = () => {
    if (newOccurence === '') {
      return
    }

    setOccurences([...occurences, { name: newOccurence, synonyms: [] }])
    setNewOccurence('')
  }

  const editOccurence = (idx: number, occurence: NLU.EntityDefOccurence) => {
    setOccurences([...occurences.slice(0, idx), occurence, ...occurences.slice(idx + 1)])
  }

  const removeOccurence = (idx: number) => {
    setOccurences([...occurences.slice(0, idx), ...occurences.slice(idx + 1)])
  }

  return (
    <div className={style.entityEditorBody}>
      <div className={style.dataPane}>
        <FormGroup
          label={
            <span>
              <Tooltip
                content="An occurence is a value of your entity. Each occurences can have multiple synonyms."
                position={Position.LEFT}
                popoverClassName={style.configPopover}
              >
                <span>
                  New Occurence&nbsp;
                  <Icon icon="help" color={Colors.GRAY3} />
                </span>
              </Tooltip>
            </span>
          }
          labelFor="occurence"
        >
          <InputGroup
            rightElement={<Button icon="add" minimal onClick={addOccurance} />}
            type="text"
            id="occurence"
            placeholder="insert the value ex: Chicago"
            value={newOccurence}
            onKeyDown={e => e.keyCode === 13 && addOccurance()}
            onChange={e => setNewOccurence(e.target.value)}
          />
        </FormGroup>
        {occurences.length > 0 && <Label>Occurences</Label>}
        {occurences.map((o, i) => (
          <Occurence
            key={o.name}
            occurence={o}
            remove={removeOccurence.bind(null, i)}
            onChange={editOccurence.bind(null, i)}
          />
        ))}
      </div>
      <div className={style.configPane}>
        <Label>Options</Label>
        <Checkbox
          checked={sensitive}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSensitive(e.target.checked)}
        >
          <span>Contains sensitive data</span>&nbsp;
          <Tooltip
            content="Sensitive information are replaced by * before being saved in the database"
            position={Position.RIGHT}
            popoverClassName={style.configPopover}
          >
            <Icon icon="help" color={Colors.GRAY3} />
          </Tooltip>
        </Checkbox>
      </div>
    </div>
  )
}
