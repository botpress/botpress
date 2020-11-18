import { Checkbox, FormGroup, InputGroup, NumericInput, Radio, RadioGroup, Switch, TextArea } from '@blueprintjs/core'
import { ConditionParam } from 'botpress/sdk'
import { lang } from 'botpress/shared'
import _ from 'lodash'
import React, { FC } from 'react'
import ContentPickerWidget from '~/components/Content/Select/Widget'

import Dropdown from './Condition/Dropdown'

type Props = {
  value?: any
  updateValue: (value) => void
} & ConditionParam

const SingleParam: FC<Props> = props => {
  const { value, label, type, subType, list, required, updateValue } = props

  const fieldLabel = required ? `${label} *` : label

  switch (type) {
    case 'string':
      return (
        <FormGroup key={label} label={fieldLabel}>
          {props.rows ? (
            <TextArea value={value} onChange={e => updateValue(e.currentTarget.value)} rows={props.rows} fill />
          ) : (
            <InputGroup value={value || ''} onChange={e => updateValue(e.currentTarget.value)} />
          )}
        </FormGroup>
      )

    case 'number':
      return (
        <FormGroup key={label} label={fieldLabel}>
          <NumericInput value={value || 0} onValueChange={value => updateValue(value)} />
        </FormGroup>
      )

    case 'list':
      if (subType === 'radio') {
        return (
          <FormGroup key={label} label={fieldLabel}>
            <RadioGroup onChange={item => updateValue(item.currentTarget.value)} selectedValue={value}>
              {list.items.map(item => (
                <Radio key={item.label} label={lang.tr(item.label)} value={item.value} />
              ))}
            </RadioGroup>
          </FormGroup>
        )
      } else {
        return (
          <FormGroup key={label} label={fieldLabel}>
            <Dropdown
              listOptions={list}
              defaultValue={value}
              selectedValue={value}
              onChange={item => updateValue(item && item.value)}
            />
          </FormGroup>
        )
      }

    case 'array':
      return (
        <FormGroup key={label} label={fieldLabel}>
          <TextArea
            value={_.isArray(value) ? value.join('\n') : value}
            onChange={e => updateValue(e.currentTarget.value.split('\n'))}
            rows={props.rows || 1}
            fill
          />
        </FormGroup>
      )

    case 'boolean':
      if (subType === 'switch') {
        return (
          <Switch key={label} label={fieldLabel} checked={value} onChange={e => updateValue(e.currentTarget.checked)} />
        )
      } else {
        return (
          <Checkbox
            key={label}
            label={fieldLabel}
            checked={value}
            onChange={e => updateValue(e.currentTarget.checked)}
          />
        )
      }

    case 'content':
      return (
        <FormGroup key={label} label={fieldLabel}>
          <ContentPickerWidget
            style={{ zIndex: 0 }}
            name="contentPicker"
            id="contentPicker"
            itemId={value}
            onChange={item => updateValue(item.id)}
          />
        </FormGroup>
      )
  }
}

export default SingleParam
