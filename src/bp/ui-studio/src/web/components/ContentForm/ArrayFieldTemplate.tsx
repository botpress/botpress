import { Button, Intent, Position, Tooltip } from '@blueprintjs/core'
import { lang } from 'botpress/shared'
import cx from 'classnames'
import React, { useEffect, useRef } from 'react'
import style from '~/views/OneFlow/sidePanel/form/style.scss'

import SmartInput from '../SmartInput'

const ArrayFieldTemplate = props => {
  const { canAdd, onAddClick, items, schema, formContext } = props
  const key = useRef(`${formContext?.customKey}`)

  useEffect(() => {
    key.current = formContext.customKey
  }, [formContext?.customKey])

  const renderDeleteBtn = (element, className?) => (
    <div className={className}>
      <Tooltip content={lang.tr('delete')} position={Position.TOP}>
        <Button
          icon="trash"
          minimal
          small
          intent={Intent.DANGER}
          onClick={element.onDropIndexClick(element.index)}
        ></Button>
      </Tooltip>
    </div>
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
                key={`${key.current}${element.key}`}
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
          {lang.tr('add')} {schema.title}
        </Button>
      )}
    </div>
  )
}

export default ArrayFieldTemplate
