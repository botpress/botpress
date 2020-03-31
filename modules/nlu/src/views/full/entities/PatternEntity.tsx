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

  const validateExamples = _.debounce(() => {
    let p = pattern
    if (!p.startsWith('^')) {
      p = '^' + p
    }
    if (!p.endsWith('$')) {
      p = p + '$'
    }
    const rx = new RegExp(p, matchCase ? '' : 'i')
    const allMatching = examplesStr
      .split('\n')
      .filter(ex => ex !== '')
      .map(ex => rx.test(ex))
      .every(Boolean)

    setExamplesMatch(allMatching)
  }, 750)

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
      props.updateEntity(newEntity.id, newEntity)
    } catch (e) {
      setPatternValid(false)
    }
  }, [pattern, matchCase, sensitive, examplesStr])

  return (
    <div className={style.entityEditorBody}>
      <div className={style.dataPane}>
        <FormGroup
          label={lang.tr('nlu.entities.patternLabel')}
          labelFor="pattern"
          labelInfo={
            patternValid ? null : (
              <Tag intent="danger" minimal className={style.validationTag}>
                {lang.tr('nlu.entities.patternInvalid')}
              </Tag>
            )
          }
        >
          <InputGroup
            leftIcon={<Icon iconSize={20} className={style.regexInputDash} icon="slash" />}
            rightElement={<Icon iconSize={20} className={style.regexInputDash} icon="slash" />}
            type="text"
            id="pattern"
            placeholder={lang.tr('nlu.entities.patternPlaceholder')}
            value={pattern}
            intent={patternValid ? 'none' : 'danger'}
            onChange={e => setPattern(e.target.value)}
          />
        </FormGroup>
        <FormGroup
          label={lang.tr('nlu.entities.examplesLabel')}
          labelFor="examples"
          labelInfo={
            examplesStr &&
            patternValid && (
              <Tag intent={allExamplesMatch ? 'success' : 'danger'} minimal className={style.validationTag}>
                {allExamplesMatch ? lang.tr('nlu.entities.matchingSuccess') : lang.tr('nlu.entities.matchingError')}
              </Tag>
            )
          }
        >
          <TextArea
            id="examples"
            fill
            rows={6}
            growVertically={true}
            placeholder={lang.tr('nlu.entities.examplesPlaceholder')}
            value={examplesStr}
            intent={allExamplesMatch ? 'none' : 'danger'}
            onChange={e => setExampleStr(e.target.value)}
          />
        </FormGroup>
      </div>
      <div className={style.configPane}>
        <Label>{lang.tr('nlu.entities.optionsLabel')}</Label>
        <Checkbox
          checked={matchCase}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setMatchCase(e.target.checked)}
        >
          <span>{lang.tr('nlu.entities.matchCaseLabel')}</span>&nbsp;
          <Tooltip
            content={lang.tr('nlu.entities.matchCaseTooltip')}
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
          <span>{lang.tr('nlu.sensitiveLabel')}</span>&nbsp;
          <Tooltip
            content={lang.tr('nlu.sensitiveTooltip')}
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
