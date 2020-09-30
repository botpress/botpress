import { Button, Tooltip } from '@blueprintjs/core'
import { BotEvent, ExecuteNode, FlowNode, FlowVariable } from 'botpress/sdk'
import {
  Icons,
  lang,
  MainContent,
  MoreOptions,
  MoreOptionsItems,
  MultiLevelDropdown,
  sharedStyle,
  Tabs
} from 'botpress/shared'
import cx from 'classnames'
import { CUSTOM_ACTION } from 'common/action'
import { LocalActionDefinition, Variables } from 'common/typings'
import _ from 'lodash'
import React, { FC, Fragment, useEffect, useState } from 'react'
import * as portals from 'react-reverse-portal'

import style from './style.scss'
import ConfigAction from './ConfigAction'

interface Props {
  node: FlowNode
  customKey: string
  contentLang: string
  variables: Variables
  actions: LocalActionDefinition[]
  editorPortal: portals.HtmlPortalNode
  events: BotEvent[]
  formData: ExecuteNode
  onUpdate: (data: Partial<ExecuteNode>) => void
  onUpdateVariables: (variable: FlowVariable) => void
  deleteNode: () => void
  close: () => void
}

const newAction = { label: 'Code New Action', value: CUSTOM_ACTION }

const executeReducer = (state, action) => {
  if (action.type === 'setup') {
    return {
      ...state,
      ...action.data
    }
  } else if (action.type === 'updateArgs') {
    return {
      ...state,
      args: action.data
    }
  } else if (action.type === 'changeAction') {
    return {
      ...state,
      selectedAction: action.data,
      code: ''
    }
  }
}

const ExecuteForm: FC<Props> = ({
  node,
  customKey,
  actions,
  variables,
  events,
  formData,
  contentLang,
  editorPortal,
  close,
  deleteNode,
  onUpdate,
  onUpdateVariables
}) => {
  const [canOutsideClickClose, setCanOutsideClickClose] = useState(true)
  const [showOptions, setShowOptions] = useState(false)
  const [maximized, setMaximized] = useState(false)
  const [isCodeEditor, setIsCodeEditor] = useState(formData?.actionName === newAction.value)
  const [forceUpdate, setForceUpdate] = useState(false)

  const [state, dispatch] = React.useReducer(executeReducer, {
    selectedAction: '',
    code: '',
    args: undefined,
    customKey: ''
  })

  useEffect(() => {
    dispatch({
      type: 'setup',
      data: {
        selectedAction: formData?.actionName,
        code: formData?.code ?? '',
        args: variables.currentFlow?.map(x => ({ name: x.params.name, type: `BP.${x.type}.Variable` })),
        customKey
      }
    })

    setForceUpdate(!forceUpdate)
  }, [customKey])

  useEffect(() => {
    if (!isCodeEditor) {
      setMaximized(false)
    }
  }, [isCodeEditor])

  useEffect(() => {
    dispatch({
      type: 'updateArgs',
      data: variables.currentFlow?.map(x => ({ name: x.params.name, type: `BP.${x.type}.Variable` }))
    })
  }, [variables.currentFlow])

  useEffect(() => {
    setIsCodeEditor(state.selectedAction === newAction.value)
  }, [state.selectedAction])

  const moreOptionsItems: MoreOptionsItems[] = [
    {
      label: lang.tr('deleteNode'),
      action: deleteNode,
      type: 'delete'
    }
  ]

  const toggleSize = () => {
    setMaximized(!maximized)
  }

  const onActionChanged = (actionName: string) => {
    dispatch({ type: 'changeAction', data: actionName })
    onUpdate({ actionName, code: '' })

    if (actionName === newAction.value && !maximized) {
      setMaximized(true)
    }
  }

  const onlyLegacy = actions
    .filter(a => a.legacy)
    .map(x => ({ ...x, category: x.category || lang.tr('uncategorized'), title: x.title || x.name }))

  const selectedOption = onlyLegacy
    .map(x => ({ label: x.title, value: x.name }))
    .find(a => a.value === state.selectedAction)

  const multiLevelActions = onlyLegacy.reduce((acc, action) => {
    const category = acc.find(c => c.name === action.category) || { name: action.category, items: [] }

    category.items.push({ label: action.title, value: action.name })

    return [...acc.filter(a => a.name !== action.category), category]
  }, [])

  const handleCodeNewAction = () => {
    onActionChanged(newAction.value)
    setIsCodeEditor(true)
  }

  const commonProps = {
    customKey,
    contentLang,
    formData,
    events,
    variables,
    onUpdate,
    onUpdateVariables
  }

  return (
    <MainContent.RightSidebar
      className={cx(sharedStyle.wrapper, style.formWrap, { [style.maximized]: maximized })}
      canOutsideClickClose={canOutsideClickClose}
      close={() => close()}
    >
      <Fragment key={`${node?.id}`}>
        <div className={sharedStyle.formHeader}>
          <Tabs tabs={[{ id: 'content', title: lang.tr('studio.flow.nodeType.execute') }]} />
          <div>
            <MoreOptions show={showOptions} onToggle={setShowOptions} items={moreOptionsItems} />
            {isCodeEditor && (
              <Tooltip content={lang.tr(maximized ? 'minimizeInspector' : 'maximizeInspector')}>
                <Button
                  className={sharedStyle.expandBtn}
                  small
                  minimal
                  icon={maximized ? <Icons.Minimize /> : 'fullscreen'}
                  onClick={toggleSize}
                />
              </Tooltip>
            )}
          </div>
        </div>
        <div
          className={cx(sharedStyle.fieldWrapper, sharedStyle.typeField, {
            [sharedStyle.noBorder]: !selectedOption
          })}
        >
          <span className={sharedStyle.formLabel}>{lang.tr('Action')}</span>

          <MultiLevelDropdown
            addBtn={{
              text: lang.tr('codeNewAction'),
              onClick: handleCodeNewAction,
              selected: state.selectedAction === newAction.value
            }}
            filterable
            className={sharedStyle.formSelect}
            items={multiLevelActions}
            defaultItem={selectedOption}
            placeholder={lang.tr('studio.flow.node.pickAction')}
            confirmChange={
              selectedOption && {
                message: lang.tr('studio.content.confirmChangeAction'),
                acceptLabel: lang.tr('change'),
                callback: setCanOutsideClickClose
              }
            }
            onChange={option => onActionChanged(option.value)}
          />
        </div>

        <div className={cx(style.editorWrap, { [style.hidden]: !isCodeEditor })}>
          <portals.OutPortal
            node={editorPortal}
            displayed={isCodeEditor}
            customKey={state.customKey}
            onChange={code => onUpdate({ code })}
            code={state.code}
            args={state.args}
            hints={events}
            maximized={maximized}
          />
        </div>

        {selectedOption !== undefined && !isCodeEditor && (
          <ConfigAction {...commonProps} actions={actions} actionName={state.selectedAction} />
        )}
      </Fragment>
    </MainContent.RightSidebar>
  )
}

export default ExecuteForm
