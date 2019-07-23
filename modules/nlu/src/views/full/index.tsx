import { Icon, Tab, Tabs, Tag } from '@blueprintjs/core'
import { AxiosInstance } from 'axios'
import { Container, SidePanel, SplashScreen } from 'botpress/ui'
import _ from 'lodash'
import React, { FC, useEffect, useState } from 'react'

import { makeApi } from '../api'

import EntityEditor from './entities/EntityEditor'
import { EntitySidePanelSection } from './entities/SidePanelSection'
import IntentEditor from './intents/editor'
import { IntentSidePanelSection } from './intents/SidePanelSection'
import style from './style.scss'

export interface CurrentItem {
  name: string
  type: 'intent' | 'entity'
}

interface Props {
  bp: { axios: AxiosInstance }
  contentLang: string
}

const NLU: FC<Props> = props => {
  const api = makeApi(props.bp)
  const [currentItem, setCurrentItem] = useState<CurrentItem | undefined>()
  const [intents, setIntents] = useState([])
  const [entities, setEntities] = useState([])
  const [contexts, setContexts] = useState([])

  const loadIntents = () => api.fetchIntents().then(setIntents)
  const loadEntities = () => api.fetchEntities().then(setEntities)

  useEffect(() => {
    api.fetchContexts().then(setContexts)
    loadIntents()
    loadEntities()
  }, [])

  const updateEntity = entity => {
    api.updateEntity(entity)
    const i = entities.findIndex(ent => ent.id == entity.id)
    setEntities([...entities.slice(0, i), entity, ...entities.slice(i + 1)])
  }

  const intentsPanel = (
    <IntentSidePanelSection
      api={api}
      contentLang={props.contentLang}
      intents={intents}
      currentItem={currentItem}
      setCurrentItem={setCurrentItem}
      reloadIntents={loadIntents}
    />
  )

  const entitiesPanel = (
    <EntitySidePanelSection
      api={api}
      entities={entities}
      currentItem={currentItem}
      setCurrentItem={setCurrentItem}
      reloadEntities={loadEntities}
    />
  )

  return (
    <Container>
      <SidePanel>
        <Tabs id="nlu-tabs" className={style.headerTabs} defaultSelectedTabId="intents" large={false}>
          <Tab id="intents" panel={intentsPanel}>
            <span>Intents</span>{' '}
            <Tag large={false} round={true} minimal={true}>
              {intents.length}
            </Tag>
          </Tab>
          <Tab id="entities" panel={entitiesPanel}>
            <span>Entities</span>{' '}
            <Tag large={false} round={true} minimal={true}>
              {entities.length}
            </Tag>
          </Tab>
        </Tabs>
      </SidePanel>
      <div className={style.container}>
        {!currentItem && (
          <SplashScreen
            icon={<Icon iconSize={80} icon="translate" style={{ marginBottom: '3em' }} />}
            title="Understanding"
            description="Use Botpress native Natural language understanding engine to make your bot smarter."
          />
        )}
        {currentItem && currentItem.type === 'intent' && (
          <IntentEditor
            intent={intents.find(i => i.name == currentItem.name)}
            contexts={contexts} // TODO fetch this within the component
            axios={props.bp.axios} // TODO replace this with api instance
            reloadIntents={loadIntents}
            contentLang={props.contentLang}
          />
        )}
        {currentItem && currentItem.type === 'entity' && (
          <EntityEditor entity={entities.find(ent => ent.name === currentItem.name)} onUpdate={updateEntity} />
        )}
      </div>
    </Container>
  )
}

export default NLU
