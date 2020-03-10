import { Button } from '@blueprintjs/core'
import classnames from 'classnames'
import React, { FC, Fragment, useEffect, useReducer, useState } from 'react'
import TextareaAutosize from 'react-autosize-textarea'

import style from '../style.scss'

import { FormState } from './index'

interface Props {
  formState: FormState
  dispatchForm: any
}

const SaySomethingFormText: FC<Props> = props => {
  const { formState, dispatchForm } = props
  const { text, variations } = formState

  const updateVariations = (value, index) => {
    const newVariations = formState.variations

    newVariations[index] = value

    dispatchForm({ type: 'updateData', data: { value: newVariations, field: 'variations' } })
  }

  const handleKeyDown = e => {
    if ((e.ctrlKey || e.metaKey) && e.keyCode === 65) {
      e.target.select()
    }
  }

  return (
    <Fragment>
      <label className={style.fieldWrapper}>
        <span className={style.formLabel}>Message*</span>
        <TextareaAutosize
          className={style.textarea}
          onKeyDown={handleKeyDown}
          value={text}
          rows={1}
          maxRows={4}
          onChange={e => dispatchForm({ type: 'updateData', data: { field: 'text', value: e.currentTarget.value } })}
        ></TextareaAutosize>
      </label>
      <div className={style.fieldWrapper}>
        <span className={style.formLabel}>Alternates</span>
        {variations &&
          variations.map((variantion, index) => (
            <TextareaAutosize
              key={index}
              rows={1}
              maxRows={4}
              onKeyDown={handleKeyDown}
              className={classnames(style.textarea, style.multipleInputs)}
              value={variantion}
              onChange={e => updateVariations(e.currentTarget.value, index)}
            ></TextareaAutosize>
          ))}
        <Button
          onClick={() => dispatchForm({ type: 'addVariation' })}
          className={style.addContentBtn}
          icon="plus"
          large={true}
        >
          Add Alternates
        </Button>
      </div>
    </Fragment>
  )
}

export default SaySomethingFormText
