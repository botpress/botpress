import { Tab, Tabs } from '@blueprintjs/core'
import axios from 'axios'
import { FlowNode, FlowVariable, FlowVariableOperator } from 'botpress/sdk'
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
}

const RouterForm: FC<Props> = ({
  close,
  node,
  diagramEngine,
  deleteNode,
  variables,
  editingCondition,
  contentLang,
  onUpdateVariables
}) => {
  const transition = node?.next?.[editingCondition]
  const [showOptions, setShowOptions] = useState(false)

  const parseInitialOperation = (): Operation => {
    if (!transition?.condition?.length) {
      return { args: {} } as Operation
    }

    const parser = new OperationParser()
    try {
      return parser.parse(transition.condition)
    } catch {
      return { args: {} } as Operation
    }
  }

  const [operation, setOperation] = useState<Operation>(parseInitialOperation())
  const variableType = variables?.currentFlow?.find(x => x.params.name === operation.variable)?.type
  const variableConfig = variables?.primitive?.find(x => x.id === variableType)?.config
  const operatorOptions = variableConfig?.operators?.map<Option>(x => ({ label: lang.tr(x.label), value: x.func }))
  const operator = variableConfig?.operators?.find(x => x.func === operation.operator)

  useEffect(() => {
    setOperation(parseInitialOperation())
  }, [node?.id])

  useEffect(() => {
    if (!node) {
      return
    }

    if (!operation?.operator) {
      operation.operator = variableConfig?.operators[0].func
    }

    let caption = undefined
    let condition = 'false'
    if (operator) {
      const serializer = new OperationSerializer()
      condition = serializer.serialize(operation)

      const friendlyArgs: any = {}
      for (const [key, value] of Object.entries(operation.args)) {
        friendlyArgs[key] =
          typeof value === 'string' && value.startsWith('$') ? value.substr(1, value.length - 1) : value
      }

      caption = lang.tr(operator.caption, {
        var: operation.variable,
        op: lang.tr(operator.label).toLowerCase(),
        ...friendlyArgs
      })
    }

    const next = [...node.next]
    next[editingCondition] = {
      ...next[editingCondition],
      condition,
      caption
    }

    const flowBuilder = diagramEngine.flowBuilder.props
    flowBuilder.switchFlowNode(node.id)
    flowBuilder.updateFlowNode({ next })
  }, [operation])

  return (
    <RightSidebar className={style.wrapper} canOutsideClickClose={true} close={() => close()}>
      <Fragment key={`${node?.id}`}>
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
                  variableTypes: variables.primitive.map(x => x.id)
                }
              ]}
              advancedSettings={[]}
              formData={{ x: operation.variable }}
              onUpdate={x => setOperation({ ...operation, variable: x.value })}
            />
          </div>
          {operatorOptions && (
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
                    options: operatorOptions,
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
                onUpdate={x => setOperation({ ...operation, ...x })}
              />
              <Contents.Form
                currentLang={contentLang}
                axios={axios}
                onUpdateVariables={onUpdateVariables}
                variables={variables}
                fields={operator?.fields || []}
                advancedSettings={operator?.advancedSettings || []}
                formData={operation.args}
                onUpdate={x => setOperation({ ...operation, args: x })}
              />
            </Fragment>
          )}
        </div>
      </Fragment>
    </RightSidebar>
  )
}

export default RouterForm
