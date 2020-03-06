import { Checkbox, FormGroup, InputGroup, NumericInput } from '@blueprintjs/core'
import { ConditionListOptions } from 'botpress/sdk'
import _ from 'lodash'
import React, { FC } from 'react'
import ContentPickerWidget from '~/components/Content/Select/Widget'

import Dropdown from './Condition/Dropdown'

interface Props {
  label: string
  value?: any
  type: 'string' | 'number' | 'boolean' | 'list' | 'content'
  list?: ConditionListOptions
  updateValue: (value) => void
}

const SingleParam: FC<Props> = props => {
  const { value, label, type, list, updateValue } = props

  if (type === 'string') {
    return (
      <FormGroup key={label} label={label}>
        <InputGroup value={value || ''} onChange={e => updateValue(e.currentTarget.value)} />
      </FormGroup>
    )
  } else if (type === 'number') {
    return (
      <FormGroup key={label} label={label}>
        <NumericInput value={value || 0} onValueChange={value => updateValue(value)} />
      </FormGroup>
    )
  } else if (type === 'list') {
    return (
      <FormGroup key={label} label={label}>
        <Dropdown
          listOptions={list}
          defaultValue={value}
          selectedValue={value}
          onChange={item => updateValue(item && item.value)}
        />
      </FormGroup>
    )
  } else if (type === 'boolean') {
    return <Checkbox key={label} label={label} checked={value} onChange={e => updateValue(e.currentTarget.checked)} />
  } else if (type === 'content') {
    return (
      <FormGroup key={label} label={label}>
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
