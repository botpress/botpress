import {
  Checkbox,
  Colors,
  FormGroup,
  H1,
  Icon,
  InputGroup,
  Label,
  Position,
  Tag,
  TextArea,
  Tooltip
} from '@blueprintjs/core'
import { NLU } from 'botpress/sdk'
import _ from 'lodash'
import React, { useEffect, useState } from 'react'

import style from './style.scss'

interface Props {
  entity: NLU.EntityDefinition
  updateEntity: (entity: NLU.EntityDefinition) => void
}

export const PatternEntityEditor: React.FC<Props> = props => {
  const [matchCase, setMatchCase] = useState<boolean>(props.entity.matchCase)
  const [sensitive, setSensitive] = useState<boolean>(props.entity.sensitive)
  const [pattern, setPattern] = useState<string>(props.entity.pattern)
  const [paternValid, setPatternValid] = useState<boolean>(true)
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
      props.updateEntity(newEntity)
    } catch (e) {
      setPatternValid(false)
    }
  }, [pattern, matchCase, sensitive, examplesStr])

  return (
    <div className={style.entityEditorBody}>
      <div className={style.dataPane}>
        <FormGroup
          label="Regular expression"
          labelFor="pattern"
          labelInfo={
            paternValid ? null : (
              <Tag intent="danger" minimal className={style.validationTag}>
                Invalid pattern
              </Tag>
            )
          }
        >
          <InputGroup
            leftIcon={<Icon iconSize={20} className={style.regexInputDash} icon="slash" />}
            rightElement={<Icon iconSize={20} className={style.regexInputDash} icon="slash" />}
            type="text"
            id="pattern"
            placeholder="Insert a valid pattern"
            value={pattern}
            intent={paternValid ? 'none' : 'danger'}
            onChange={e => setPattern(e.target.value)}
          />
        </FormGroup>
        <FormGroup
          label="Matching examples"
          labelFor="examples"
          labelInfo={
            examplesStr &&
            paternValid && (
              <Tag intent={allExamplesMatch ? 'success' : 'danger'} minimal className={style.validationTag}>
                {allExamplesMatch ? 'All examples match' : "Some examples don't match"}
              </Tag>
            )
          }
        >
          <TextArea
            id="examples"
            fill
            rows={6}
            growVertically={true}
            placeholder="Add examples that match your pattern (one per line)"
            value={examplesStr}
            intent={allExamplesMatch ? 'none' : 'danger'}
            onChange={e => setExampleStr(e.target.value)}
          />
        </FormGroup>
      </div>
      <div className={style.configPane}>
        <Label>Options</Label>
        <Checkbox
          checked={matchCase}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setMatchCase(e.target.checked)}
        >
          <span>Match case</span>&nbsp;
          <Tooltip
            content="Whether your pattern is case sensitive"
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
