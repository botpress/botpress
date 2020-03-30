import { Button, Intent, Position, Tooltip } from '@blueprintjs/core'
import cx from 'classnames'
import React from 'react'

import SmartInput from '../SmartInput'

import style from './style.scss'

const Variations = props => {
  const { canAdd, onAddClick, items, schema } = props

  const renderDeleteBtn = (element, className?) => (
    <Tooltip content="Delete" position={Position.TOP}>
      <Button
        icon="trash"
        minimal
        small
        intent={Intent.DANGER}
        className={className}
        onClick={element.onDropIndexClick(element.index)}
      ></Button>
    </Tooltip>
  )

  return (
    <div className={style.fieldWrapper}>
      <span className={style.formLabel}>{schema.title}</span>
      {items?.map(element => {
        const { type } = schema.items

        return (
          <div key={element.key} className={style.innerWrapper}>
            {type === 'string' ? (
              <SmartInput
                value={element.children?.props?.formData}
                onChange={element.children?.props?.onChange}
                className={cx(style.textarea, style.multipleInputs)}
                isSideForm
                singleLine={false}
              >
                {renderDeleteBtn(element)}
              </SmartInput>
            ) : (
              <div className={cx(style.multipleInputs)}>
                {element.children}
                {renderDeleteBtn(element, style.deleteBtn)}
              </div>
            )}
          </div>
        )
      })}

      {canAdd && (
        <Button onClick={onAddClick} className={style.addContentBtn} large={true}>
          Add Alternates
        </Button>
      )}
    </div>
  )
}

export default Variations
