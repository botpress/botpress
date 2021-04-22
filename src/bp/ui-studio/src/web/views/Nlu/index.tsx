import { Icon } from '@blueprintjs/core'
import { NLU } from 'botpress/sdk'
import { EmptyState, lang } from 'botpress/shared'
import _ from 'lodash'
import React, { FC, useEffect, useState } from 'react'
import { Container } from '~/components/Shared/Interface'
import withLanguage from '~/components/Util/withLanguage'

import { makeNLUClient } from './client'

import { EntityEditor } from './entities/EntityEditor'
import { IntentEditor } from './intents/FullEditor'
import { LiteEditor } from './intents/LiteEditor'
import { NLUSidePanel } from './SidePanel'
import style from './style.scss'

type NLUItemType = 'intent' | 'entity'
export interface NluItem {
  name: string
  type: NLUItemType
}

interface Props {
  contentLang: string
}

const ITEM_TYPE_PARAM = 'type'
const ITEM_NAME_PARAM = 'id'

const NLU: FC<Props> = props => {
  const api = makeNLUClient()
  const [currentItem, setCurrentItem] = useState<NluItem | undefined>()
  const [intents, setIntents] = useState([])
  const [entities, setEntities] = useState([])

  const loadIntents = () =>
    api
      .fetchIntents()
      .then(setIntents)
      .then(x => setCurrentItem(undefined))
      .then(x => setCurrentItem(currentItem)) // this is little hack to trigger update for IntentEditor->Slots->SlotModal
  const loadEntities = () => api.fetchEntities().then(setEntities)

  useEffect(() => {
    intents.length === 0 && loadIntents()
    entities.length === 0 && loadEntities()
    setCurrentItemFromPath()
  }, [window.location.href])

  const handleSelectItem = (item: NluItem | undefined) => {
    setCurrentItem(item)

    const url = new URL(window.location.href)
    if (item) {
      url.searchParams.set(ITEM_TYPE_PARAM, item.type)
      url.searchParams.set(ITEM_NAME_PARAM, item.name)
    }
    window.history.pushState(window.history.state, '', url.toString())
  }

  const getCurrentItemFromPath = () => {
    const url = new URL(window.location.href)
    const type = url.searchParams.get(ITEM_TYPE_PARAM)
    const name = url.searchParams.get(ITEM_NAME_PARAM)
    if (type && name) {
      return { type, name } as NluItem
    }
  }

  const setCurrentItemFromPath = () => {
    const newCurrentItem = getCurrentItemFromPath()
    if (!isEqual(newCurrentItem, currentItem)) {
      setCurrentItem(newCurrentItem)
    }
  }

  const isEqual = (item: NluItem, otherItem: NluItem) => {
    const isSame = item === otherItem
    const areDefined = item && otherItem
    return isSame || (areDefined && item.name === otherItem.name && item.type === otherItem.type)
  }

  const updateEntity = (targetEntity: string, entity) => {
    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    api.updateEntity(targetEntity, entity)
    const i = entities.findIndex(ent => ent.name === entity.name)
    setEntities([...entities.slice(0, i), entity, ...entities.slice(i + 1)])
  }

  const currentItemExists = () => {
    return (
      currentItem &&
      (currentItem.type === 'intent'
        ? intents.find(i => i.name === currentItem.name)
        : entities.find(e => e.name === currentItem.name))
    )
  }

  const customEntities = entities.filter(e => e.type !== 'system')

  return (
    <Container>
      <NLUSidePanel
        api={api}
        contentLang={props.contentLang}
        currentItem={currentItem}
        entities={customEntities}
        intents={intents}
        reloadEntities={loadEntities}
        reloadIntents={loadIntents}
        setCurrentItem={handleSelectItem}
      />
      <div className={style.container}>
        {!currentItemExists() && (
          <EmptyState
            icon={<Icon icon="translate" iconSize={70} className={style.emtpyStateIcon} />}
            text={lang.tr('nlu.description')}
          />
        )}
        {!!intents.length && currentItem && currentItem.type === 'intent' && (
          <IntentEditor intent={currentItem.name} api={api} contentLang={props.contentLang} showSlotPanel />
        )}
        {currentItem && currentItem.type === 'entity' && (
          <EntityEditor
            entities={entities}
            entity={entities.find(ent => ent.name === currentItem.name)}
            updateEntity={_.debounce(updateEntity, 2500)}
          />
        )}
      </div>
    </Container>
  )
}

export default withLanguage(NLU)

export { LiteEditor, EntityEditor }
