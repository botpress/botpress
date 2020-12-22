import { AnchorButton, Button, ButtonGroup, Intent, Position, Tooltip } from '@blueprintjs/core'
import { lang } from 'botpress/shared'
import cx from 'classnames'
import React, { Fragment, useEffect, useRef } from 'react'
import style from '~/views/FlowBuilder/sidePanelTopics/form/style.scss'

import SmartInput from '../SmartInput'

import localStyle from './style.scss'

const ArrayFieldTemplate = props => {
  const { canAdd, onAddClick, items, schema, formContext } = props
  const key = useRef(`${formContext?.customKey}`)

  useEffect(() => {
    key.current = formContext.customKey
  }, [formContext?.customKey])

  const renderDeleteBtn = (element, minimal) => (
    <Tooltip content={lang.tr('delete')} position={Position.TOP}>
      <Button
        icon="trash"
        minimal={minimal}
        small
        intent={Intent.DANGER}
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
          <div key={`${element.key}-${element.index}`} className={style.innerWrapper}>
            {type === 'string' ? (
              <SmartInput
                key={`${key.current}${element.key}`}
                value={element.children?.props?.formData}
                onChange={element.children?.props?.onChange}
                className={cx(style.textarea, style.multipleInputs)}
                isSideForm
                singleLine={false}
              >
                {renderDeleteBtn(element, true)}
              </SmartInput>
            ) : (
              <div className={cx(style.multipleInputs)}>
                {element.children}
                <ButtonGroup className={localStyle.actionsWrapper}>
                  {props.uiSchema?.['ui:options']?.orderable !== false && (
                    <Fragment>
                      <Tooltip content={lang.tr('moveUp')} position={Position.TOP}>
                        <AnchorButton
                          icon="arrow-up"
                          disabled={!element.hasMoveUp}
                          small
                          onClick={element.onReorderClick(element.index, element.index - 1)}
                        ></AnchorButton>
                      </Tooltip>
                      <Tooltip content={lang.tr('moveDown')} position={Position.TOP}>
                        <AnchorButton
                          icon="arrow-down"
                          small
                          disabled={!element.hasMoveDown}
                          onClick={element.onReorderClick(element.index, element.index + 1)}
                        ></AnchorButton>
                      </Tooltip>
                    </Fragment>
                  )}
                  {renderDeleteBtn(element, false)}
                </ButtonGroup>
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
