import axios from 'axios'
import { BotEvent, FlowNode, FlowVariable, FormData, FormField, NodeTransition } from 'botpress/sdk'
import { Contents, lang, MainContent, MoreOptions, MoreOptionsItems, sharedStyle, Tabs } from 'botpress/shared'
import { Variables } from 'common/typings'
import _ from 'lodash'
import React, { FC, Fragment, useState } from 'react'

interface Props {
  deleteContent: () => void
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
  deleteContent,
  variables,
  events,
  node,
  contentLang
}) => {
  const [showOptions, setShowOptions] = useState(false)

  const moreOptionsItems: MoreOptionsItems[] = [
    {
      label: lang.tr('deleteContent'),
      action: deleteContent,
      type: 'delete'
    }
  ]

  const prepareUpdate = data => {
    onUpdate({ suggest: data })
    return
    const langs = Object.keys(data.suggestions)
    const transitions: NodeTransition[] = [
      ...(node?.next.filter(
        transition => transition.contentIndex !== editingContent && transition.condition !== 'true'
      ) || [])
    ]

    const triggers = data.suggestions[defaultLang].map(({ name, tags }, idx) => {
      const utterances = langs.reduce((acc, curr) => {
        return { ...acc, [curr]: [name, ...(data.suggestions[curr]?.find(x => x.name === name)?.tags || [])] }
      }, {})

      const currentDest = node?.next.find(x => x.condition === `choice-${name}${idx}`)?.node ?? ''

      transitions.push({
        condition: `choice-${name}${idx}`,
        caption: [...([name] || []), ...(tags || [])].filter(Boolean).join(' · '),
        contentIndex: editingContent,
        node: currentDest
      })

      return {
        name: `choice-${name}${idx}`,
        effect: 'jump.node',
        conditions: [
          {
            params: { utterances },
            id: 'user_intent_is'
          }
        ],
        type: 'contextual',
        gotoNodeId: currentDest,
        suggestion: { label: name, value: name, position: data.position },
        expiryPolicy: {
          strategy: data.expiryPolicy,
          turnCount: data.turnCount ?? 3
        }
      }
    })

    onUpdate({ triggers, transitions })
  }

  const fields: FormField[] = [
    {
      group: {
        addLabel: 'module.builtin.types.suggestions.addTextAlternative'
      },
      type: 'text_array',
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
