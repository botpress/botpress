import {
  Checkbox,
  Colors,
  FormGroup,
  Icon,
  InputGroup,
  Label,
  Position,
  Tag,
  TextArea,
  Tooltip
} from '@blueprintjs/core'
import { NLU } from 'botpress/sdk'
import { lang } from 'botpress/shared'
import _ from 'lodash'
import React, { useEffect, useState } from 'react'

import style from './style.scss'

interface Props {
  entity: NLU.EntityDefinition
  updateEntity: (targetEntity: string, entity: NLU.EntityDefinition) => void
}

export const PatternEntityEditor: React.FC<Props> = props => {
  const [matchCase, setMatchCase] = useState<boolean>(props.entity.matchCase)
  const [sensitive, setSensitive] = useState<boolean>(props.entity.sensitive)
  const [pattern, setPattern] = useState<string>(props.entity.pattern)
  const [patternValid, setPatternValid] = useState<boolean>(true)
  const [examplesStr, setExampleStr] = useState((props.entity.examples || []).join('\n'))
  const [allExamplesMatch, setExamplesMatch] = useState<boolean>(true)

  useEffect(() => {
    setMatchCase(!!props.entity.matchCase)
    setSensitive(props.entity.sensitive)
    setPattern(props.entity.pattern)
    setExampleStr((props.entity.examples || []).join('\n'))
  }, [props.entity])

  const getEntityId = (entityName: string) =>
    entityName
      .trim()
      .toLowerCase()
      .replace(/[\t\s]/g, '-')

  const validateExamples = _.debounce(() => {
    let p = pattern
    if (!p.startsWith('^')) {
      p = `^${p}`
    }
    if (!p.endsWith('$')) {
      p = `${p}$`
    }
    const rx = new RegExp(p, matchCase ? '' : 'i')
    const allMatching = examplesStr
      .split('\n')
      .filter(ex => ex !== '')
      .map(ex => rx.test(ex))
      .every(Boolean)

    setExamplesMatch(allMatching)
  }, 750)

  const updateEntity = _.debounce(newEntity => {
    if (!_.isEqual(props.entity, newEntity)) {
      props.updateEntity(getEntityId(newEntity.name), newEntity)
    }
  }, 100)

  useEffect(() => {
    try {
      new RegExp(pattern)
      setPatternValid(true)
      const newEntity: NLU.EntityDefinition = {
        ...props.entity,
        pattern,
        sensitive,
        matchCase,
        examples: examplesStr.trim().split('\n')
      }
      validateExamples()
      updateEntity(newEntity)
    } catch (e) {
      setPatternValid(false)
    }
  }, [pattern, matchCase, sensitive, examplesStr]) // TODO useReducer and watch state instead or explicitly call update entity while

  return (
    <div key={getEntityId(props.entity?.name)} className={style.entityEditorBody}>
      <div className={style.dataPane}>
        <FormGroup
          label={lang.tr('module.nlu.entities.patternLabel')}
          labelFor="pattern"
          labelInfo={
            patternValid ? null : (
              <Tag intent="danger" minimal className={style.validationTag}>
                {lang.tr('module.nlu.entities.patternInvalid')}
              </Tag>
            )
          }
        >
          <InputGroup
            leftIcon={<Icon iconSize={20} className={style.regexInputDash} icon="slash" />}
            rightElement={<Icon iconSize={20} className={style.regexInputDash} icon="slash" />}
            type="text"
            id="pattern"
            placeholder={lang.tr('module.nlu.entities.patternPlaceholder')}
            value={pattern}
            intent={patternValid ? 'none' : 'danger'}
            onChange={e => setPattern(e.target.value)}
          />
        </FormGroup>
        <FormGroup
          label={lang.tr('module.nlu.entities.examplesLabel')}
          labelFor="examples"
          labelInfo={
            examplesStr &&
            patternValid && (
              <Tag intent={allExamplesMatch ? 'success' : 'danger'} minimal className={style.validationTag}>
                {allExamplesMatch
                  ? lang.tr('module.nlu.entities.matchingSuccess')
                  : lang.tr('module.nlu.entities.matchingError')}
              </Tag>
            )
          }
        >
          <TextArea
            id="examples"
            fill
            rows={6}
            growVertically={true}
            placeholder={lang.tr('module.nlu.entities.examplesPlaceholder')}
            value={examplesStr}
            intent={allExamplesMatch ? 'none' : 'danger'}
            onChange={e => setExampleStr(e.target.value)}
          />
        </FormGroup>
      </div>
      <div className={style.configPane}>
        <Label>{lang.tr('options')}</Label>
        <Checkbox
          checked={matchCase}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setMatchCase(e.target.checked)}
        >
          <span>{lang.tr('module.nlu.entities.matchCaseLabel')}</span>&nbsp;
          <Tooltip
            content={lang.tr('module.nlu.entities.matchCaseTooltip')}
            position={Position.RIGHT}
            popoverClassName={style.configPopover}
          >
            <Icon icon="help" color={Colors.GRAY3} />
          </Tooltip>
        </Checkbox>
        <Checkbox
          checked={sensitive}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSensitive(e.target.checked)}
        >
          <span>{lang.tr('module.nlu.entities.sensitiveLabel')}</span>&nbsp;
          <Tooltip
            content={lang.tr('module.nlu.entities.sensitiveTooltip')}
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
