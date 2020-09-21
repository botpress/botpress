import { Button, Intent, Position, Tooltip } from '@blueprintjs/core'
import { BotEvent, FlowVariable, FormData } from 'botpress/sdk'
import { Dropdown, FormFields, lang, sharedStyle } from 'botpress/shared'
import { Variables } from 'common/typings'
import _uniqueId from 'lodash/uniqueId'
import React, { FC, Fragment, useState } from 'react'

import style from './style.scss'

interface Props {
  field: any
  data: any
  onChange: (value: FormData) => void
  onUpdateVariables?: (variable: FlowVariable) => void
  variables?: Variables
  events?: BotEvent[]
  choices
}

const VarTypePickerArray: FC<Props> = ({ onChange, field, data, choices }) => {
  const [localData, setLocalData] = useState(data.items?.length ? data.items : [{ item: '' }, { item: '' }])

  const addType = () => {
    setLocalData([...localData, { item: '' }])
  }

  const deleteItem = index => {
    const updatedItems = localData.filter((x, i) => i !== index)
    setLocalData([...updatedItems])
    onChange({
      items: updatedItems
    })
  }

  const updateItem = (value, index) => {
    localData[index].item = value.value
    setLocalData([...localData])
    onChange({
      items: localData
    })
  }

  return (
    <FormFields.FieldWrapper label={lang.tr(field.label)}>
      {localData.map((item, index) => (
        <Fragment key={index}>
          <div className={style.dropdownWrapper}>
            <Dropdown
              filterable={false}
              className={sharedStyle.formSelect}
              placeholder={lang.tr('variable.pickType')}
              items={choices}
              defaultItem={item.item}
              rightIcon="chevron-down"
              onChange={value => updateItem(value, index)}
            />
            {index > 1 && (
              <Tooltip position={Position.TOP_LEFT} content={lang.tr('deleteField')}>
                <Button
                  onClick={() => deleteItem(index)}
                  className={style.deleteBtn}
                  minimal
                  small
                  intent={Intent.DANGER}
                  icon="trash"
                />
              </Tooltip>
            )}
          </div>
          {index !== localData.length - 1 && <span className={style.separator}>{lang.tr('or')}</span>}
        </Fragment>
      ))}
      <FormFields.AddButton text={lang.tr('studio.library.addType')} onClick={() => addType()} />
    </FormFields.FieldWrapper>
  )
}

export default VarTypePickerArray
