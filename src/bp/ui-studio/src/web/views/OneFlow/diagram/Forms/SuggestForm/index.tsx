import axios from 'axios'
import { BotEvent, FlowNode, FlowVariable, FormData, FormField, NodeTransition } from 'botpress/sdk'
import { Contents, lang, MainContent, MoreOptions, MoreOptionsItems, sharedStyle, Tabs } from 'botpress/shared'
import { Variables } from 'common/typings'
import _ from 'lodash'
import React, { FC, Fragment, useState } from 'react'

interface Props {
  deleteNode: () => void
  editingContent: number
  customKey: string
  variables: Variables
  events: BotEvent[]
  close: (closingKey: number) => void
  onUpdate: (data: any) => void
  onUpdateVariables: (variable: FlowVariable) => void
  formData: FormData
  defaultLang: string
  contentLang: string
  node: FlowNode
}

const ContentForm: FC<Props> = ({
  customKey,
  editingContent,
  defaultLang,
  close,
  formData,
  onUpdate,
  onUpdateVariables,
  deleteNode,
  variables,
  events,
  node,
  contentLang
}) => {
  const [showOptions, setShowOptions] = useState(false)

  const moreOptionsItems: MoreOptionsItems[] = [
    {
      label: lang.tr('module.builtin.types.suggestions.deleteSuggestions'),
      action: deleteNode,
      type: 'delete'
    }
  ]

  const prepareUpdate = data => {
    const transitions = []

    const triggers = data.suggestions.reduce((acc, suggestion, index) => {
      const currentDest = node?.next.find(x => x.condition === `choice-${index}`)?.node ?? ''

      transitions.push({
        condition: `choice-${index}`,
        suggestion,
        node: currentDest
      })

      return [
        ...acc,
        {
          conditions: [{ params: { utterances: { ...suggestion.label } }, id: 'user_intent_is' }],
          effect: 'jump.node',
          expiryPolicy: { strategy: data.turn ? 'turn' : 'workflow', turnCount: data.turnCount ?? 0 },
          gotoNodeId: currentDest,
          name: `choice-${index}`,
          suggestion,
          type: 'contextual'
        }
      ]
    }, [])

    onUpdate({ triggers, transitions, suggest: data })
  }

  const fields: FormField[] = [
    {
      group: {
        addLabel: 'module.builtin.types.suggestions.addTextAlternative'
      },
      type: 'text_array',
      translated: true,
      key: 'text',
      label: 'text'
    },
    {
      group: {
        addLabel: 'module.builtin.types.suggestions.add',
        contextMenu: [
          {
            type: 'delete',
            label: 'module.builtin.types.suggestions.delete'
          }
        ],
        defaultItem: true
      },
      type: 'group',
      key: 'suggestions',
      label: 'fields::label',
      fields: [
        {
          group: {
            addLabel: 'module.builtin.types.suggestions.addSuggestionLabel'
          },
          type: 'text_array',
          key: 'label',
          translated: true,
          label: 'module.builtin.types.suggestions.label',
          placeholder: 'module.builtin.types.suggestions.labelPlaceholder'
        },
        {
          key: 'openUrl',
          label: 'module.builtin.types.actionButton.urlLabel',
          type: 'checkbox',
          related: {
            key: 'url',
            type: 'text',
            label: 'url'
          }
        }
      ]
    }
  ]
  const advancedSettings: FormField[] = [
    {
      label: 'module.builtin.types.suggestions.numberOfTurns',
      type: 'checkbox',
      key: 'turn',
      related: {
        key: 'turnCount',
        defaultValue: 0,
        type: 'number',
        placeholder: 'module.builtin.types.suggestions.writeNumberOfTurns'
      }
    }
  ]

  return (
    <MainContent.RightSidebar className={sharedStyle.wrapper} canOutsideClickClose close={() => close(editingContent)}>
      <Fragment key={`${contentLang}-${customKey || editingContent}`}>
        <div className={sharedStyle.formHeader}>
          <Tabs tabs={[{ id: 'content', title: lang.tr('studio.flow.nodeType.say') }]} />
          <MoreOptions show={showOptions} onToggle={setShowOptions} items={moreOptionsItems} />
        </div>
        <Contents.Form
          axios={axios}
          currentLang={contentLang}
          defaultLang={defaultLang}
          variables={variables}
          events={events}
          fields={fields}
          advancedSettings={advancedSettings}
          formData={formData}
          onUpdate={data => prepareUpdate({ ...data })}
          onUpdateVariables={onUpdateVariables}
        />
      </Fragment>
    </MainContent.RightSidebar>
  )
}

export default ContentForm
