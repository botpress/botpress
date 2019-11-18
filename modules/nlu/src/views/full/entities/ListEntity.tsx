import { Button, Colors, FormGroup, Icon, InputGroup, Position, Radio, RadioGroup, Tooltip } from '@blueprintjs/core'
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
  const [fuzzy, setFuzzy] = useState(props.entity.fuzzy)
  const [newOccurence, setNewOccurence] = useState('')
  const [occurences, setOccurences] = useState(props.entity.occurences)

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

  const handleFuzzyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFuzzy(parseFloat(e.target.value))
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
            placeholder="Type a value (ex: Chicago)"
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
        <FormGroup
          label={
            <Tooltip
              content="Fuzziness will tolerate slight errors in extraction, typos for instance. Strict means no errors allowed."
              position={Position.LEFT}
              popoverClassName={style.configPopover}
            >
              <span>
                Fuzzy matching options&nbsp;
                <Icon icon="help" color={Colors.GRAY3} />
              </span>
            </Tooltip>
          }
        />
        <RadioGroup onChange={handleFuzzyChange} selectedValue={fuzzy} inline>
          <Radio label="Strict" value={1} />
          <Radio label="Medium" value={0.8} />
          <Radio label="Loose" value={0.65} />
        </RadioGroup>
      </div>
    </div>
  )
}
