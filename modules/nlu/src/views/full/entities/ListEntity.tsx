import {
  Button,
  Classes,
  Colors,
  FormGroup,
  Icon,
  InputGroup,
  Position,
  Radio,
  RadioGroup,
  Text,
  Tooltip
} from '@blueprintjs/core'
import { NLU } from 'botpress/sdk'
import _ from 'lodash'
import React, { useEffect, useState } from 'react'

import style from './style.scss'
import { Occurrence } from './ListEntityOccurrence'

interface Props {
  entity: NLU.EntityDefinition
  updateEntity: (targetEntity: string, entity: NLU.EntityDefinition) => void
}

const FuzzyTolerance = {
  Strict: 1,
  Medium: 0.8,
  Loose: 0.65
}

export const ListEntityEditor: React.FC<Props> = props => {
  const [fuzzy, setFuzzy] = useState(props.entity.fuzzy)
  const [newOccurrence, setNewOccurrence] = useState('')
  const [occurrences, setOccurrences] = useState(props.entity.occurrences)

  useEffect(() => {
    setOccurrences(props.entity.occurrences)
    setFuzzy(props.entity.fuzzy)
  }, [props.entity.id])

  useEffect(() => {
    const newEntity = { ...props.entity, fuzzy, occurrences }
    if (!_.isEqual(newEntity, props.entity)) {
      props.updateEntity(newEntity.id, newEntity)
    }
  }, [occurrences, fuzzy])

  const isNewOccurrenceEmpty = () => newOccurrence.trim().length === 0

  const addOccurrence = () => {
    if (isNewOccurrenceEmpty()) {
      return
    }

    setOccurrences([...occurrences, { name: newOccurrence, synonyms: [] }])
    setNewOccurrence('')
  }

  const editOccurrence = (idx: number, occurrence: NLU.EntityDefOccurrence) => {
    setOccurrences([...occurrences.slice(0, idx), occurrence, ...occurrences.slice(idx + 1)])
  }

  const removeOccurrence = (idx: number) => {
    setOccurrences([...occurrences.slice(0, idx), ...occurrences.slice(idx + 1)])
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
                content="An occurrence is a value of your entity. Each occurrence can have multiple synonyms."
                position={Position.LEFT}
                popoverClassName={style.configPopover}
              >
                <span>
                  New occurrence&nbsp;
                  <Icon icon="help" color={Colors.GRAY3} />
                </span>
              </Tooltip>
            </span>
          }
          labelFor="occurrence"
        >
          <InputGroup
            rightElement={<Button icon="add" minimal onClick={addOccurrence} disabled={isNewOccurrenceEmpty()} />}
            type="text"
            id="occurrence"
            placeholder="Type a value (ex: Chicago)"
            value={newOccurrence}
            onKeyDown={e => e.keyCode === 13 && addOccurrence()}
            onChange={e => setNewOccurrence(e.target.value)}
          />
        </FormGroup>
        {occurrences.length > 0 && (
          <FormGroup label="Occurrences">
            {occurrences.map((o, i) => (
              <Occurrence
                key={o.name}
                occurrence={o}
                remove={removeOccurrence.bind(null, i)}
                onChange={editOccurrence.bind(null, i)}
              />
            ))}
          </FormGroup>
        )}
      </div>
      <div className={style.configPane}>
        <FormGroup
          label={
            <Tooltip
              content="Fuzziness will tolerate slight errors (e.g: typos) in words of 4 characters or more. Strict means no errors allowed."
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
          <Radio label="Strict" value={FuzzyTolerance.Strict} />
          <Radio label="Medium" value={FuzzyTolerance.Medium} />
          <Radio label="Loose" value={FuzzyTolerance.Loose} />
        </RadioGroup>
      </div>
    </div>
  )
}
