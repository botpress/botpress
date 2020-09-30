import axios from 'axios'
import sdk from 'botpress/sdk'
import { Contents, lang, MainContent, MoreOptions, MoreOptionsItems, sharedStyle, Tabs } from 'botpress/shared'
import cx from 'classnames'
import { Variables } from 'common/typings'
import _ from 'lodash'
import React, { FC, Fragment, useEffect, useRef, useState } from 'react'

import { getEntityId } from '.'
import VarTypePickerArray from './VarTypePickerArray'

interface Props {
  customKey: string
  defaultLang: string
  contentLang: string
  formData: sdk.NLU.EntityDefinition
  variables: Variables
  close: () => void
  deleteEntity: (entityId: string) => void
  updateEntity: (originalId: string, entity: sdk.NLU.EntityDefinition) => void
  updateFormItem: (entity) => void
}

const ComplexForm: FC<Props> = ({
  customKey,
  defaultLang,
  contentLang,
  formData,
  variables,
  close,
  updateEntity,
  deleteEntity,
  updateFormItem
}) => {
  const originalEntity = useRef(formData)
  const [showOptions, setShowOptions] = useState(false)
  const [forceUpdate, setForceUpdate] = useState(false)

  useEffect(() => {
    setForceUpdate(!forceUpdate)
    originalEntity.current = formData
  }, [customKey])

  useEffect(() => {
    if (_.isEqual(formData, originalEntity.current)) {
      return
    }

    const newEntity = { ...formData }

    updateEntity(originalEntity.current.name, newEntity)
    originalEntity.current = newEntity
  }, [formData])

  const moreOptionsItems: MoreOptionsItems[] = [
    {
      label: lang.tr('studio.library.deleteVariableFromLibrary'),
      action: () => deleteEntity(formData.name),
      type: 'delete'
    }
  ]

  const convertToSelect = data => {
    const items = [
      ...(data.list_entities?.map(item => ({ item })) ?? []),
      ...(data.pattern_entities?.map(item => ({ item })) ?? [])
    ]

    return { ...data, items }
  }

  const convertFromSelect = data => {
    const items = data.items
      .filter(x => x.item)
      .map(({ item }) => ({
        type: variables.display.find(x => x.subType === item)?.type,
        subType: item
      }))

    const result = {
      list_entities: items.filter(x => x.type === 'enumeration').map(x => x.subType),
      pattern_entities: items.filter(x => x.type === 'pattern').map(x => x.subType)
    }

    updateFormItem({ ...data, pattern: '', ...result })
  }

  const choices = variables.display
    .filter(x => ['enumeration', 'pattern'].includes(x.type))
    .map(({ label, subType }) => ({ label, value: subType }))
  return (
    <MainContent.RightSidebar className={sharedStyle.wrapper} canOutsideClickClose={true} close={() => close()}>
      <Fragment key={customKey}>
        <div className={cx(sharedStyle.formHeader, sharedStyle.noSelect)}>
          <Tabs tabs={[{ id: 'content', title: lang.tr('complex') }]} />
          <MoreOptions show={showOptions} onToggle={setShowOptions} items={moreOptionsItems} />
        </div>

        <Contents.Form
          currentLang={contentLang}
          defaultLang={defaultLang}
          axios={axios}
          fields={[
            {
              type: 'overridable',
              key: 'items',
              label: lang.tr('studio.library.possibleVarTypes'),
              overrideKey: 'varTypeOverride',
              defaultValue: [{ item: '' }, { item: '' }]
            },
            {
              key: 'examples',
              type: 'text_array',
              label: 'examples',
              placeholder: 'studio.library.complexityExamplePlaceholder',
              group: {
                minimum: 1,
                addLabel: 'studio.library.addExample',
                addLabelTooltip: 'studio.library.addExampleTooltip'
              }
            }
          ]}
          overrideFields={{
            varTypeOverride: props => <VarTypePickerArray {...props} choices={choices} />
          }}
          advancedSettings={[]}
          formData={convertToSelect(formData)}
          invalidFields={[]}
          onUpdate={convertFromSelect}
        />
      </Fragment>
    </MainContent.RightSidebar>
  )
}

export default ComplexForm
