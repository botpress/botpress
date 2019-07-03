import { Icon } from '@blueprintjs/core'
import { Container, SidePanel, SplashScreen } from 'botpress/ui'
import _ from 'lodash'
import React, { useEffect, useState } from 'react'

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

// TODO better typings
const NLU = props => {
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
    this.setState({
      entities: [...this.state.entities.slice(0, i), entity, ...this.state.entities.slice(i + 1)]
    })
  }

  return (
    <Container>
      <SidePanel>
        <IntentSidePanelSection
          api={api}
          intents={intents}
          currentItem={currentItem}
          setCurrentItem={setCurrentItem}
          reloadIntents={loadIntents}
        />
        <EntitySidePanelSection
          api={api}
          entities={entities}
          currentItem={currentItem}
          setCurrentItem={setCurrentItem}
          reloadEntities={loadEntities}
        />
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
