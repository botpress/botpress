import { ActionParameter, BotEvent, ExecuteNode, FlowVariable, FormField } from 'botpress/sdk'
import { Contents, lang } from 'botpress/shared'
import cx from 'classnames'
import { Variables } from 'common/typings'
import React, { FC, Fragment, useEffect, useRef } from 'react'
import * as portals from 'react-reverse-portal'
import InjectedModuleView from '~/components/PluginInjectionSite/module'

import contentStyle from '../ContentForm/style.scss'

import style from './style.scss'

interface Props {
  customKey: string
  contentLang: string
  variables: Variables
  events: BotEvent[]
  formData: ExecuteNode
  maximized: boolean
  portalNode: any
  setMaximized: (val: boolean) => void
  onUpdate: (data: Partial<ExecuteNode>) => void
  onUpdateVariables: (variable: FlowVariable) => void
}

const emptyAction = `
  const myAction = async () => {
    \u00A0\u00A0
  }
  return myAction()`

// TODO Move editor to a portal to avoid heavy operations
const CodeEditor: FC<Props> = ({
  customKey,
  variables,
  events,
  formData,
  maximized,
  contentLang,
  portalNode,
  setMaximized,
  onUpdate,
  onUpdateVariables
}) => {
  const originalCode = useRef(formData?.code ?? emptyAction)
  const params = useRef([])

  useEffect(() => {
    if (formData?.code) {
      originalCode.current = formData.code
      refreshArgs()
    } else {
      originalCode.current = emptyAction
    }

    setMaximized(true)
  }, [customKey])

  useEffect(() => {
    refreshArgs()
  }, [formData?.params])

  const refreshArgs = () => {
    params.current = Object.keys(formData?.params ?? {}).map(name => {
      if (formData.params[name].source === 'variable' && name) {
        const type = variables.currentFlow.find(v => v.params?.name === name)?.type
        return { name, type: `BP.${type}.Variable` }
      }
    })
  }

  const fields: FormField[] = [
    {
      type: 'group',
      key: 'variables',
      label: lang.tr('Variables'),
      fields: [
        {
          type: 'variable',
          key: 'name',
          label: 'Variable',
          variableTypes: variables.display.map(x => x.type),
          placeholder: 'module.builtin.setValueToPlaceholder'
        }
      ],
      group: {
        addLabel: lang.tr('Add Parameter'),
        minimum: 1,
        contextMenu: [
          {
            type: 'delete',
            label: 'delete'
          }
        ]
      }
    }
  ]

  const handleCodeChanged = data => {
    onUpdate({ code: data.content })
  }

  const onUpdateContent = data => {
    const transformed = data.variables.reduce(
      (acc, curr) => ({ ...acc, [curr.name]: { source: 'variable' } as ActionParameter }),
      {}
    )
    onUpdate({ params: transformed })
  }

  const data = Object.keys(formData?.params ?? {}).map(key => ({ name: key }))

  return (
    <Fragment>
      <div className={cx(contentStyle.fieldWrapper, contentStyle.contentTypeField)}>
        <Contents.Form
          currentLang={contentLang}
          variables={variables}
          events={events}
          fields={fields}
          advancedSettings={[]}
          formData={{ variables: data }}
          onUpdate={onUpdateContent}
          onUpdateVariables={onUpdateVariables}
        />
      </div>

      {/* <div style={{ height: '100%' }}>
        <InjectedModuleView
          moduleName="code-editor"
          componentName="LiteEditor"
          extraProps={{ code: originalCode.current, maximized, args: params.current, onChange: handleCodeChanged }}
        />
      </div> */}

      <div className={style.editorWrap}>
        <portals.OutPortal
          node={portalNode}
          onChange={handleCodeChanged}
          code={originalCode.current}
          args={params.current}
          maximized={maximized}
        />
      </div>
    </Fragment>
  )
}

export default CodeEditor
