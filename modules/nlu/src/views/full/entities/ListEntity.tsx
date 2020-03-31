import { Button, Colors, FormGroup, Icon, InputGroup, Position, Radio, RadioGroup, Tooltip } from '@blueprintjs/core'
import { NLU } from 'botpress/sdk'
import { lang } from 'botpress/shared'
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
                content={lang.tr('nlu.entities.occurrenceTooltip')}
                position={Position.LEFT}
                popoverClassName={style.configPopover}
              >
                <span>
                  {lang.tr('nlu.entities.newOccurrence')}&nbsp;
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
            placeholder={lang.tr('nlu.entities.occurrencePlaceholder')}
            value={newOccurrence}
            onKeyDown={e => e.keyCode === 13 && addOccurrence()}
            onChange={e => setNewOccurrence(e.target.value)}
          />
        </FormGroup>
        {occurrences.length > 0 && (
          <FormGroup label={lang.tr('nlu.entities.occurrenceLabel')}>
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
              content={lang.tr('nlu.entities.fuzzyTooltip')}
              position={Position.LEFT}
              popoverClassName={style.configPopover}
            >
              <span>
                {lang.tr('nlu.entities.fuzzyLabel')}&nbsp;
                <Icon icon="help" color={Colors.GRAY3} />
              </span>
            </Tooltip>
          }
        />
        <RadioGroup onChange={handleFuzzyChange} selectedValue={fuzzy} inline>
          <Radio label={lang.tr('nlu.entities.strict')} value={FuzzyTolerance.Strict} />
          <Radio label={lang.tr('nlu.entities.medium')} value={FuzzyTolerance.Medium} />
          <Radio label={lang.tr('nlu.entities.loose')} value={FuzzyTolerance.Loose} />
        </RadioGroup>
      </div>
    </div>
  )
}
