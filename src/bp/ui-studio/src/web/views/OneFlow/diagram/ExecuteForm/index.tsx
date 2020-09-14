import { Button, Tab, Tabs, Tooltip } from '@blueprintjs/core'
import { BotEvent, ExecuteNode, FlowNode, FlowVariable } from 'botpress/sdk'
import { Icons, lang, MoreOptions, MoreOptionsItems, MultiLevelDropdown, RightSidebar } from 'botpress/shared'
import cx from 'classnames'
import { CUSTOM_ACTION } from 'common/action'
import { LocalActionDefinition, Variables } from 'common/typings'
import _ from 'lodash'
import React, { FC, Fragment, useCallback, useEffect, useRef, useState } from 'react'
import * as portals from 'react-reverse-portal'

import contentStyle from '../ContentForm/style.scss'

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
  const selectedAction = useRef(formData?.actionName)
  const originalCode = useRef(formData?.code ?? '')
  const flowArgs = useRef(undefined)

  const updateCode = useCallback(
    _.debounce((value: string) => onUpdate({ code: value }), 1000),
    []
  )

  useEffect(() => {
    selectedAction.current = formData?.actionName

    if (selectedAction.current === newAction.value) {
      updateCode.cancel()

      flowArgs.current = variables.currentFlow?.map(x => ({ name: x.params.name, type: `BP.${x.type}.Variable` }))
      originalCode.current = formData?.code ?? ''
    }

    setMaximized(isCodeEditor)
    setForceUpdate(!forceUpdate)
  }, [customKey])

  useEffect(() => {
    setMaximized(isCodeEditor)
  }, [isCodeEditor])

  useEffect(() => {
    flowArgs.current = variables.currentFlow?.map(x => ({ name: x.params.name, type: `BP.${x.type}.Variable` }))
  }, [variables.currentFlow])

  useEffect(() => {
    setIsCodeEditor(formData?.actionName === newAction.value)
  }, [formData?.actionName])

  useEffect(() => {
    document.documentElement.style.setProperty('--right-sidebar-width', maximized ? '580px' : '240px')
  }, [maximized])

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
    selectedAction.current = actionName
    onUpdate({ actionName })

    if (actionName === newAction.value && !maximized) {
      setMaximized(true)
    }
  }

  const onlyLegacy = actions
    .filter(a => a.legacy)
    .map(x => ({ ...x, category: x.category || lang.tr('uncategorized'), title: x.title || x.name }))

  const selectedOption = onlyLegacy
    .map(x => ({ label: x.title, value: x.name }))
    .find(a => a.value === selectedAction.current)

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
    <RightSidebar
      className={style.wrapper}
      canOutsideClickClose={canOutsideClickClose}
      close={() => {
        if (isCodeEditor) {
          updateCode.flush()
        }
        close()
      }}
    >
      <Fragment key={`${node?.id}`}>
        <div className={style.formHeader}>
          <Tabs id="contentFormTabs">
            <Tab id="content" title={lang.tr('studio.flow.nodeType.execute')} />
          </Tabs>
          <div>
            <MoreOptions show={showOptions} onToggle={setShowOptions} items={moreOptionsItems} />
            <Tooltip content={lang.tr(maximized ? 'minimizeInspector' : 'maximizeInspector')}>
              <Button
                className={style.expandBtn}
                small
                minimal
                icon={maximized ? <Icons.Minimize /> : 'fullscreen'}
                onClick={toggleSize}
              />
            </Tooltip>
          </div>
        </div>
        <div className={cx(contentStyle.fieldWrapper, contentStyle.contentTypeField)}>
          <span className={contentStyle.formLabel}>{lang.tr('Action')}</span>

          <MultiLevelDropdown
            addBtn={{ text: lang.tr('codeNewAction'), onClick: handleCodeNewAction }}
            filterable
            className={contentStyle.formSelect}
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
            onChange={updateCode}
            code={originalCode.current}
            customKey={customKey}
            args={flowArgs.current}
            maximized={maximized}
          />
        </div>

        {selectedOption !== undefined && !isCodeEditor && (
          <ConfigAction {...commonProps} actions={actions} actionName={selectedAction.current} />
        )}
      </Fragment>
    </RightSidebar>
  )
}

export default ExecuteForm
