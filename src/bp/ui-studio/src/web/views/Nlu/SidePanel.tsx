import { NLU } from 'botpress/sdk'
import { lang, MainLayout, toast, ToolbarButtonProps } from 'botpress/shared'
import React, { FC, useState } from 'react'
import { SidePanel } from '~/components/Shared/Interface'
import { NluItem } from '.'
import { NluClient } from './client'
import { EntityNameModal } from './entities/EntityNameModal'
import { EntitySidePanelSection } from './entities/SidePanelSection'
import IntentNameModal from './intents/NameModal'
import { IntentSidePanelSection } from './intents/SidePanelSection'

import style from './style.scss'

interface Props {
  contentLang: string
  intents: NLU.IntentDefinition[]
  entities: NLU.EntityDefinition[]
  api: NluClient
  currentItem: NluItem
  setCurrentItem: (x: NluItem) => void
  reloadEntities: () => Promise<void>
  reloadIntents: () => Promise<void>
}

export const NLUSidePanel: FC<Props> = ({
  contentLang,
  intents,
  entities,
  api,
  currentItem,
  setCurrentItem,
  reloadIntents,
  reloadEntities
}) => {
  const [currentTab, setCurrentTab] = useState('intent')
  const [modalOpen, setModalOpen] = useState(Boolean)

  const tabs = [
    {
      id: 'intent',
      title: lang.tr('nlu.intents.title')
    },
    {
      id: 'entity',
      title: lang.tr('nlu.entities.title')
    }
  ]

  const buttons: ToolbarButtonProps[] = [
    {
      id: 'btn-create',
      icon: 'plus',
      onClick: () => setModalOpen(true),
      tooltip: currentTab === 'intent' ? lang.tr('nlu.intents.new') : lang.tr('nlu.entities.new')
    }
  ]

  const onEntityCreated = async (entity: NLU.EntityDefinition) => {
    setCurrentItem({ type: 'entity', name: entity.name })
    await reloadEntities()
  }

  const onIntentModalSubmit = async (name: string) => {
    const intentDef = { name, utterances: { [contentLang]: [] } }

    try {
      await api.createIntent(intentDef)
      await reloadIntents()
      setCurrentItem({ name, type: 'intent' })
    } catch (err) {
      toast.failure(lang.tr('nlu.intents.actionErrorMessage', { action: 'create' }))
    }
  }

  return (
    <SidePanel>
      <MainLayout.Toolbar
        tabChange={tab => setCurrentTab(tab)}
        tabs={tabs}
        currentTab={currentTab}
        buttons={buttons}
        className={style.headerToolbar}
      />
      {currentTab === 'intent' && (
        <React.Fragment>
          <IntentSidePanelSection
            api={api}
            contentLang={contentLang}
            intents={intents}
            currentItem={currentItem}
            setCurrentItem={setCurrentItem}
            reloadIntents={reloadIntents}
          />
          <IntentNameModal
            isOpen={modalOpen}
            toggle={() => setModalOpen(!modalOpen)}
            onSubmit={onIntentModalSubmit}
            title={lang.tr('nlu.intents.new')}
            intents={intents}
          />
        </React.Fragment>
      )}
      {currentTab === 'entity' && (
        <React.Fragment>
          <EntitySidePanelSection
            api={api}
            entities={entities}
            currentItem={currentItem}
            setCurrentItem={setCurrentItem}
            reloadEntities={reloadEntities}
            reloadIntents={reloadIntents}
          />
          <EntityNameModal
            action={'create'}
            onEntityModified={onEntityCreated}
            entityIDs={entities.map(e => e.id)}
            api={api}
            isOpen={modalOpen}
            closeModal={() => setModalOpen(false)}
          />
        </React.Fragment>
      )}
    </SidePanel>
  )
}
