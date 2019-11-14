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
  const [fuzzy, setFuzzy] = useState<boolean>(props.entity.fuzzy)
  const [newOccurence, setNewOccurence] = useState<string>('')
  const [occurences, setOccurences] = useState<NLU.EntityDefOccurence[]>(props.entity.occurences)

  useEffect(() => {
    const newEntity = { ...props.entity, fuzzy, occurences }
    if (!_.isEqual(newEntity, props.entity)) {
      props.updateEntity(newEntity)
    }
  }, [occurences, fuzzy])

  const isNewOccurenceEmtpy = () => newOccurence.trim().length === 0

  const addOccurence = () => {
    if (isNewOccurenceEmtpy()) {
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
                  New occurence&nbsp;
                  <Icon icon="help" color={Colors.GRAY3} />
                </span>
              </Tooltip>
            </span>
          }
          labelFor="occurence"
        >
          <InputGroup
            rightElement={<Button icon="add" minimal onClick={addOccurence} disabled={isNewOccurenceEmtpy()} />}
            type="text"
            id="occurence"
            placeholder="Insert the value ex: Chicago"
            value={newOccurence}
            onKeyDown={e => e.keyCode === 13 && addOccurence()}
            onChange={e => setNewOccurence(e.target.value)}
          />
        </FormGroup>
        {occurences.length > 0 && (
          <FormGroup label="Occurences">
            {occurences.map((o, i) => (
              <Occurence
                key={o.name}
                occurence={o}
                remove={removeOccurence.bind(null, i)}
                onChange={editOccurence.bind(null, i)}
              />
            ))}
          </FormGroup>
        )}
      </div>
      <div className={style.configPane}>
        <Label>Options</Label>
        <Checkbox checked={fuzzy} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFuzzy(e.target.checked)}>
          <span>Fuzzy matching</span>&nbsp;
          <Tooltip
            content="Fuzziness will tolerate slight errors in extraction, typos for instance."
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
