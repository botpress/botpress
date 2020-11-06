import { Button, Tooltip } from '@blueprintjs/core'
import { ExecuteNode, FlowNode } from 'botpress/sdk'
import {
  Form,
  Icons,
  lang,
  MainLayout,
  MoreOptions,
  MoreOptionsItems,
  MultiLevelDropdown,
  sharedStyle,
  Tabs
} from 'botpress/shared'
import cx from 'classnames'
import { CUSTOM_ACTION } from 'common/action'
import { ControlType, CustomTemplate } from 'common/controls'
import { LocalActionDefinition } from 'common/typings'
import _ from 'lodash'
import React, { FC, Fragment, useEffect, useState } from 'react'

import style from './style.scss'
import ConfigAction from './ConfigAction'

interface Props {
  node: FlowNode
  customKey: string
  contentLang: string
  actions: LocalActionDefinition[]
  events: any
  formData: ExecuteNode
  onUpdate: (data: Partial<ExecuteNode>) => void
  deleteNode: () => void
  close: () => void
  onCodeEdit: (value: string | undefined, onChange: (data: string) => void, template?: string | CustomTemplate) => void
  keepOpen: boolean
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
  events,
  formData,
  contentLang,
  close,
  deleteNode,
  onUpdate,
  onCodeEdit,
  keepOpen
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
    if (keepOpen) {
      setCanOutsideClickClose(false)
    } else {
      setTimeout(() => {
        setCanOutsideClickClose(true)
      }, 200)
    }
  }, [keepOpen])

  useEffect(() => {
    dispatch({
      type: 'setup',
      data: {
        selectedAction: formData?.actionName,
        code: formData?.code ?? '',
        customKey
      }
    })

    setForceUpdate(!forceUpdate)
  }, [customKey])

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

  const commonProps = { customKey, contentLang, formData, events, onUpdate }

  return (
    <MainLayout.RightSidebar
      className={cx(sharedStyle.wrapper, style.formWrap)}
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

        {isCodeEditor && (
          <Form.Form
            fields={{
              title: {
                type: ControlType.String,
                title: 'title'
              },
              code: {
                type: ControlType.CodeEditor,
                template: 'action'
              }
            }}
            formData={{ code: state.code, title: formData?.title }}
            onUpdate={onUpdate}
            onCodeEdit={onCodeEdit}
          />
        )}

        {selectedOption !== undefined && !isCodeEditor && (
          <ConfigAction {...commonProps} actions={actions} actionName={state.selectedAction} />
        )}
      </Fragment>
    </MainLayout.RightSidebar>
  )
}

export default ExecuteForm
