import { Icon, Tab, Tabs, Tag } from '@blueprintjs/core'
import { AxiosInstance } from 'axios'
import { lang } from 'botpress/shared'
import { Container, SidePanel, SplashScreen } from 'botpress/ui'
import _ from 'lodash'
import React, { FC, useEffect, useState } from 'react'

import { makeApi } from '../../api'

import { EntityEditor } from './entities/EntityEditor'
import { EntitySidePanelSection } from './entities/SidePanelSection'
import { IntentEditor } from './intents/FullEditor'
import { LiteEditor } from './intents/LiteEditor'
import { IntentSidePanelSection } from './intents/SidePanelSection'
import style from './style.scss'

export interface NluItem {
  name: string
  type: 'intent' | 'entity'
}

interface Props {
  bp: { axios: AxiosInstance; events: any }
  contentLang: string
}

const ITEM_TYPE_PARAM = 'type'
const ITEM_NAME_PARAM = 'id'

const NLU: FC<Props> = props => {
  const api = makeApi(props.bp)
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

  const intentsPanel = (
    <IntentSidePanelSection
      api={api}
      contentLang={props.contentLang}
      intents={intents}
      currentItem={currentItem}
      setCurrentItem={handleSelectItem}
      reloadIntents={loadIntents}
    />
  )

  const customEntities = entities.filter(e => e.type !== 'system')
  const entitiesPanel = (
    <EntitySidePanelSection
      api={api}
      entities={customEntities}
      currentItem={currentItem}
      setCurrentItem={handleSelectItem}
      reloadEntities={loadEntities}
      reloadIntents={loadIntents}
    />
  )

  return (
    <Container>
      <SidePanel>
        <Tabs id="nlu-tabs" className={style.headerTabs} defaultSelectedTabId="intents" large={false}>
          <Tab id="intents" panel={intentsPanel}>
            <span>{lang.tr('module.nlu.intents.title')}&nbsp;</span>
            <Tag large={false} round={true} minimal={true}>
              {intents.length}
            </Tag>
          </Tab>
          <Tab id="entities" panel={entitiesPanel}>
            <span>{lang.tr('module.nlu.entities.title')}</span>{' '}
            <Tag large={false} round={true} minimal={true}>
              {customEntities.length}
            </Tag>
          </Tab>
        </Tabs>
      </SidePanel>
      <div className={style.container}>
        {!currentItemExists() && (
          <SplashScreen
            icon={<Icon iconSize={80} icon="translate" style={{ marginBottom: '3em' }} />}
            title={lang.tr('module.nlu.title')}
            description={lang.tr('module.nlu.description')}
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

export default NLU

export { LiteEditor, EntityEditor }
