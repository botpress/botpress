import { Tab, Tabs } from '@blueprintjs/core'
import axios from 'axios'
import sdk from 'botpress/sdk'
import { Contents, lang, MoreOptions, MoreOptionsItems, RightSidebar } from 'botpress/shared'
import _ from 'lodash'
import React, { FC, Fragment, useEffect, useRef, useState } from 'react'

import style from '../PromptForm/style.scss'

import { getEntityId } from '.'

interface Props {
  customKey: string
  contentLang: string
  formData: sdk.NLU.EntityDefinition
  close: () => void
  deleteEntity: (entityId: string) => void
  updateEntity: (originalId: string, entity: sdk.NLU.EntityDefinition) => void
  updateFormItem: (entity) => void
}

const EnumForm: FC<Props> = ({
  customKey,
  contentLang,
  formData,
  close,
  updateEntity,
  updateFormItem,
  deleteEntity
}) => {
  const originalEntity = useRef(formData)
  const [showOptions, setShowOptions] = useState(false)
  const [forceUpdate, setForceUpdate] = useState(false)

  useEffect(() => {
    setForceUpdate(!forceUpdate)
    originalEntity.current = formData
  }, [customKey])

  useEffect(() => {
    // pattern must be omitted since the field is not present, it is converted to null
    if (_.isEqual(_.omit(formData, 'pattern'), _.omit(originalEntity.current, 'pattern'))) {
      return
    }

    const newEntity = { ...formData, pattern: '', id: getEntityId(formData.name) }

    updateEntity(originalEntity.current.id, newEntity)
    originalEntity.current = newEntity
  }, [formData])

  const moreOptionsItems: MoreOptionsItems[] = [
    {
      label: lang.tr('studio.library.deleteEnumeration'),
      action: () => deleteEntity(formData.id),
      type: 'delete'
    }
  ]

  return (
    <RightSidebar className={style.wrapper} canOutsideClickClose={true} close={close}>
      <Fragment key={customKey}>
        <div className={style.formHeader}>
          <Tabs id="contentFormTabs">
            <Tab id="content" title={lang.tr('enumeration')} />
          </Tabs>
          <MoreOptions show={showOptions} onToggle={setShowOptions} items={moreOptionsItems} />
        </div>

        <Contents.Form
          currentLang={contentLang}
          axios={axios}
          fields={[
            {
              key: 'name',
              type: 'text',
              label: 'name',
              required: true,
              maxLength: 150,
              placeholder: 'studio.library.variableName'
            },
            {
              key: 'occurrences',
              type: 'tag-input',
              label: 'values',
              placeholder: 'studio.library.addSynonyms',
              group: {
                addLabel: 'studio.library.addValueAlternative'
              }
            }
          ]}
          advancedSettings={[
            {
              key: 'fuzzy',
              type: 'select',
              label: 'tolerance',
              defaultValue: 0.8,
              options: [
                { label: 'strict', value: 1 },
                { label: 'medium', value: 0.8 },
                { label: 'loose', value: 0.65 }
              ]
            }
          ]}
          formData={formData}
          onUpdate={updateFormItem}
        />
      </Fragment>
    </RightSidebar>
  )
}

export default EnumForm
