import { Tab, Tabs } from '@blueprintjs/core'
import axios from 'axios'
import sdk from 'botpress/sdk'
import { Contents, lang, MoreOptions, MoreOptionsItems, RightSidebar, sharedStyle, toast } from 'botpress/shared'
import cx from 'classnames'
import _ from 'lodash'
import React, { FC, Fragment, useEffect, useRef, useState } from 'react'

import { getEntityId } from '.'

interface Item {
  name: string
  tags: string[]
}
interface Props {
  customKey: string
  defaultLang: string
  contentLang: string
  formData: sdk.NLU.EntityDefinition
  allEntities: sdk.NLU.EntityDefinition[]
  close: () => void
  deleteEntity: (entityId: string) => void
  updateEntity: (originalId: string, entity: sdk.NLU.EntityDefinition) => void
  updateFormItem: (entity) => void
}

const EnumForm: FC<Props> = ({
  customKey,
  defaultLang,
  contentLang,
  formData,
  allEntities,
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

    const newEntity = { ...formData, pattern: '' }

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

  const convertToTags = data => {
    return {
      ...data,
      occurrences: data.occurrences.map(({ name, synonyms }) => ({ name, tags: synonyms }))
    }
  }

  const convertFromTags = data => {
    return {
      ...data,
      occurrences: data.occurrences.map(({ name, tags }) => ({ name, synonyms: tags }))
    }
  }

  const onUpdate = data => {
    updateFormItem(convertFromTags(data))
  }

  const isDuplicate = (localItems: Item[], newItem: Item) => {
    const lastAdded: string = [newItem.name, ...newItem.tags].slice(-1)[0].toLowerCase()
    for (const occurence of localItems) {
      if ([...[occurence.name], ...occurence.tags].map(occ => occ.toLowerCase()).includes(lastAdded)) {
        toast.failure(`${lastAdded} already exists in ${occurence.name}`)
        return false
      }
    }

    for (const entity of allEntities.filter(x => x.name !== formData.name)) {
      for (const occurence of entity.occurrences) {
        if ([...[occurence.name], ...occurence.synonyms].map(occ => occ.toLowerCase()).includes(lastAdded)) {
          toast.failure(`${lastAdded} already exists in ${occurence.name} (${entity.name})`)
          return false
        }
      }
    }
    return true
  }

  return (
    <RightSidebar className={sharedStyle.wrapper} canOutsideClickClose={true} close={close}>
      <Fragment key={customKey}>
        <div className={cx(sharedStyle.formHeader, sharedStyle.noSelect)}>
          <Tabs id="contentFormTabs">
            <Tab id="content" title={lang.tr('enumeration')} />
          </Tabs>
          <MoreOptions show={showOptions} onToggle={setShowOptions} items={moreOptionsItems} />
        </div>

        <Contents.Form
          currentLang={contentLang}
          defaultLang={defaultLang}
          axios={axios}
          fields={[
            {
              key: 'occurrences',
              type: 'tag-input',
              label: 'values',
              placeholder: 'studio.library.addSynonyms',
              emptyPlaceholder: 'studio.library.writeAsManyHintsAsPossible',
              group: {
                minimum: 1,
                addLabel: 'studio.library.addValueAlternative'
              },
              validation: { validator: isDuplicate }
            }
          ]}
          advancedSettings={[
            {
              key: 'fuzzy',
              type: 'select',
              label: 'variable.textMatchingTolerance',
              defaultValue: 0.8,
              options: [
                { label: 'exactMatch', value: 1 },
                { label: 'moderate', value: 0.8 },
                { label: 'loose', value: 0.65 }
              ]
            }
          ]}
          formData={convertToTags(formData)}
          onUpdate={onUpdate}
        />
      </Fragment>
    </RightSidebar>
  )
}

export default EnumForm
