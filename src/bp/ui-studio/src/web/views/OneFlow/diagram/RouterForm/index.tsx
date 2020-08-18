import { Tab, Tabs } from '@blueprintjs/core'
import axios from 'axios'
import { FlowNode, FlowVariable, FlowVariableOperator, NodeTransition } from 'botpress/sdk'
import { Contents, Dropdown, lang, MoreOptions, MoreOptionsItems, Option, RightSidebar } from 'botpress/shared'
import { Variables } from 'common/typings'
import React, { FC, Fragment, useEffect, useState } from 'react'
import { condition } from '~/views/FlowBuilder/common/style.scss'

import style from './style.scss'
import { Operation } from './Operation'
import { OperationParser } from './OperationParser'
import { OperationSerializer } from './OperationSerializer'

interface Props {
  deleteNode: () => void
  close: () => void
  node: FlowNode
  diagramEngine: any
  variables: Variables
  editingCondition: number
  contentLang: string
  onUpdateVariables: (variable: FlowVariable) => void
  customKey: string
  updateRouter: (transitions: NodeTransition[]) => void
}

const RouterForm: FC<Props> = ({
  close,
  node,
  diagramEngine,
  deleteNode,
  variables,
  editingCondition,
  contentLang,
  onUpdateVariables,
  customKey,
  updateRouter
}) => {
  const [showOptions, setShowOptions] = useState(false)

  const parseInitialOperation = (): Operation => {
    const transition = node?.next?.[editingCondition]
    if (!transition?.condition?.length) {
      return { args: {} } as Operation
    }

    const parser = new OperationParser()
    try {
      return parser.parse(transition.condition)
    } catch {
      return { args: {}, operator: '', variable: '', negate: false } as Operation
    }
  }

  const getMeta = (operation: Operation) => {
    const variableType = variables?.currentFlow?.find(x => x.params.name === operation.variable)?.type
    const variableConfig = variables?.primitive?.find(x => x.id === variableType)?.config
    const operatorOptions = variableConfig?.operators?.map<Option>(x => ({ label: lang.tr(x.label), value: x.func }))
    const operator = variableConfig?.operators?.find(x => x.func === operation.operator)

    return { variableType, variableConfig, operatorOptions, operator }
  }

  const [operation, setOperation] = useState<Operation>(parseInitialOperation())
  const meta = getMeta(operation)

  useEffect(() => {
    setOperation(parseInitialOperation())
  }, [customKey])

  const save = (newOperation: Operation) => {
    if (!node) {
      return
    }

    const newMeta = getMeta(newOperation)

    if (newOperation?.variable && !newOperation.operator) {
      newOperation.operator = newMeta.variableConfig?.operators?.[0].func
    }

    let caption = undefined
    let condition = 'false'
    if (newMeta.operator) {
      const serializer = new OperationSerializer()
      condition = serializer.serialize(newOperation)

      const friendlyArgs: any = {}
      for (const [key, value] of Object.entries(newOperation.args)) {
        friendlyArgs[key] =
          typeof value === 'string' && value.startsWith('$') ? value.substr(1, value.length - 1) : value
      }

      caption = lang.tr(newMeta.operator.caption, {
        var: newOperation.variable,
        op: lang.tr(newMeta.operator.label).toLowerCase(),
        ...friendlyArgs
      })
    }

    const next = [...node.next]
    next[editingCondition] = {
      ...next[editingCondition],
      condition,
      caption
    }

    updateRouter(next)
    setOperation(newOperation)
  }

  return (
    <RightSidebar className={style.wrapper} canOutsideClickClose={true} close={() => close()}>
      <Fragment key={customKey}>
        <div className={style.formHeader}>
          <Tabs id="contentFormTabs">
            <Tab id="content" title={lang.tr('studio.flow.nodeType.router')} />
          </Tabs>
          <MoreOptions
            show={showOptions}
            onToggle={setShowOptions}
            items={[
              {
                label: lang.tr('deleteCondition'),
                type: 'delete'
              }
            ]}
          />
        </div>
        <div className={style.actionModal}>
          <div className={style.contentTypeField}>
            <Contents.Form
              currentLang={contentLang}
              axios={axios}
              onUpdateVariables={onUpdateVariables}
              variables={variables}
              fields={[
                {
                  type: 'variable',
                  key: 'value',
                  label: lang.tr('studio.router.variable'),
                  placeholder: lang.tr('studio.router.pickVariable'),
                  variableTypes: variables.primitive.map(x => x.id)
                }
              ]}
              advancedSettings={[]}
              formData={{ value: operation.variable }}
              onUpdate={x => {
                save({ ...operation, variable: x.value })
              }}
            />
          </div>
          {meta.operatorOptions && (
            <Fragment>
              <Contents.Form
                currentLang={contentLang}
                axios={axios}
                onUpdateVariables={onUpdateVariables}
                variables={variables}
                fields={[
                  {
                    type: 'select',
                    key: 'operator',
                    label: lang.tr('studio.router.condition'),
                    options: meta.operatorOptions,
                    defaultValue: operation.operator
                  },
                  {
                    type: 'checkbox',
                    key: 'negate',
                    label: lang.tr('studio.router.negate')
                  }
                ]}
                advancedSettings={[]}
                formData={operation}
                onUpdate={x => {
                  save({ ...operation, ...x })
                }}
              />
              <Contents.Form
                currentLang={contentLang}
                axios={axios}
                onUpdateVariables={onUpdateVariables}
                variables={variables}
                fields={meta.operator?.fields || []}
                advancedSettings={meta.operator?.advancedSettings || []}
                formData={operation.args}
                onUpdate={x => {
                  save({ ...operation, args: x })
                }}
              />
            </Fragment>
          )}
        </div>
      </Fragment>
    </RightSidebar>
  )
}

export default RouterForm
