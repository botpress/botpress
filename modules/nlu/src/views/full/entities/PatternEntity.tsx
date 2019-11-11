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
import React, { useEffect, useState } from 'react'

import style from './style.scss'

interface Props {
  entity: NLU.EntityDefinition
  updateEntity: (entity: NLU.EntityDefinition) => void // promise ?
}

export const PatternEntityEditor: React.FC<Props> = props => {
  const [matchCase, setMatchCase] = useState<boolean>(false)
  const [sensitive, setSensitive] = useState<boolean>(props.entity.sensitive)
  const [pattern, setPattern] = useState<string>(props.entity.pattern)
  const [isValidPattern, setIsValidPattern] = useState<boolean>(true)

  useEffect(() => {
    try {
      const re = new RegExp(pattern, matchCase ? '' : 'i')
      setIsValidPattern(true)
      const newEntity: NLU.EntityDefinition = {
        ...props.entity,
        pattern,
        sensitive,
        matchCase
      }
      props.updateEntity(newEntity)
      // TODO try to match on every examples with created pattern, don't forget exact start and exact end logic
    } catch (e) {
      setIsValidPattern(false)
    }
  }, [pattern, matchCase, sensitive]) // TODO add examples in watchers or maybe create a 2nd handler

  return (
    <div>
      <H1>{props.entity.name}</H1>
      <div className={style.entityEditorBody}>
        <div className={style.dataPane}>
          <FormGroup
            label="Regular expression"
            labelFor="pattern"
            labelInfo={
              isValidPattern ? null : (
                <Tag intent="danger" minimal style={{ float: 'right' }}>
                  pattern invalid
                </Tag>
              )
            }
          >
            <InputGroup
              leftIcon={<Icon iconSize={20} className={style.regexInputDash} icon="slash" />}
              rightElement={<Icon iconSize={20} className={style.regexInputDash} icon="slash" />}
              type="text"
              id="pattern"
              placeholder="insert a valid pattern"
              value={pattern}
              intent={isValidPattern ? 'none' : 'danger'}
              onChange={e => setPattern(e.target.value)}
            />
          </FormGroup>
          <FormGroup label="Matching examples" labelFor="examples">
            <TextArea
              id="examples"
              fill
              rows={6}
              growVertically={true}
              placeholder="Add examples that matchs your pattern. One by line."
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
              content="Is your pattern case sensitive"
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
    </div>
  )
}
