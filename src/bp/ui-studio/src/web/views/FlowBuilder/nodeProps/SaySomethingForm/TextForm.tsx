import { Button } from '@blueprintjs/core'
import { Intent } from '@blueprintjs/core'
import classnames from 'classnames'
import React, { FC, Fragment } from 'react'
import TextareaAutosize from 'react-autosize-textarea'
import SmartInput from '~/components/SmartInput'

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

  const deleteVariation = index => {
    variations.splice(index, 1)
    dispatchForm({ type: 'updateData', data: { value: variations, field: 'variations' } })
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
        {variations?.map((variation, index) => (
          <div key={index} className={style.innerWrapper}>
            <SmartInput
              value={variation}
              onChange={value => updateVariations(value, index)}
              className={classnames(style.textarea, style.multipleInputs)}
              isSideForm
              singleLine={false}
            >
              <Button icon="trash" minimal small intent={Intent.DANGER} onClick={() => deleteVariation(index)}></Button>
            </SmartInput>
          </div>
        ))}
        <Button onClick={() => dispatchForm({ type: 'addVariation' })} className={style.addContentBtn} large={true}>
          Add Alternates
        </Button>
      </div>
    </Fragment>
  )
}

export default SaySomethingFormText
