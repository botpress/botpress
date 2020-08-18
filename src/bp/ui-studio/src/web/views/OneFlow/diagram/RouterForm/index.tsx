import { Tab, Tabs } from '@blueprintjs/core'
import axios from 'axios'
import { FlowVariable, FlowVariableConfig, FlowVariableOperator, FormField, NodeTransition, Option } from 'botpress/sdk'
import { Contents, FormFields, lang, MoreOptions, RightSidebar } from 'botpress/shared'
import cx from 'classnames'
import { Variables } from 'common/typings'
import _ from 'lodash'
import React, { FC, Fragment, useEffect, useRef, useState } from 'react'

import style from '../PromptForm/style.scss'

import { Operation } from './Operation'
import { OperationParser } from './OperationParser'
import { OperationSerializer } from './OperationSerializer'

interface Props {
  deleteTransition: () => void
  close: () => void
  variables: Variables
  transition: NodeTransition
  contentLang: string
  onUpdateVariables: (variable: FlowVariable) => void
  customKey: string
  updateRouter: (transition: NodeTransition) => void
}

type OperationMeta = {
  currentVarType: string
  varConfig: FlowVariableConfig
  operators: Option[]
  operator: FlowVariableOperator
}

const parseCondition = (condition: string): Operation => {
  if (!condition?.length) {
    return { args: {} } as Operation
  }

  const parser = new OperationParser()
  try {
    return parser.parse(condition)
  } catch {
    return { args: {}, operator: '', variable: '', negate: false } as Operation
  }
}

const RouterForm: FC<Props> = ({
  close,
  deleteTransition,
  variables,
  transition,
  contentLang,
  onUpdateVariables,
  customKey,
  updateRouter
}) => {
  const currentVarName = useRef<string>()

  const [showOptions, setShowOptions] = useState(false)
  const [forceUpdate, setForceUpdate] = useState(false)

  const currentItem = parseCondition(transition.condition)

  useEffect(() => {
    setForceUpdate(!forceUpdate)
  }, [customKey, transition, currentVarName.current, currentItem.operator])

  useEffect(() => {
    currentVarName.current = currentItem.variable
  }, [customKey])

  const getMeta = (varName: string): OperationMeta => {
    const currentVarType = variables.currentFlow?.find(x => x.params.name === varName)?.type
    const varConfig = variables.primitive.find(x => x.id === currentVarType)?.config
    const operators = varConfig?.operators?.map(x => ({ label: lang.tr(x.label), value: x.func }))
    const operator = varConfig?.operators?.find(x => x.func === currentItem.operator)

    return { currentVarType, varConfig, operators, operator }
  }

  const meta = getMeta(currentVarName.current)

  const convertToTransition = (meta: OperationMeta, operation: Operation): NodeTransition => {
    if (operation.variable && !operation.operator) {
      operation.operator = meta.operators?.[0].value
      meta = getMeta(operation.variable)
    }

    const operator = meta.varConfig?.operators?.find(x => x.func === operation.operator)

    if (!operation.operator || !operator) {
      return { condition: 'false', node: transition.node }
    }

    const serializer = new OperationSerializer()
    const condition = serializer.serialize(operation)

    const friendlyArgs = _.mapValues(operation.args, value => {
      return typeof value === 'string' && value.startsWith('$') ? value.substr(1, value.length - 1) : value || ''
    })

    const caption = lang.tr(`${operator.caption}${operation.negate ? 'Not' : ''}`, {
      var: operation.variable,
      op: lang.tr(operator.label).toLowerCase(),
      ...friendlyArgs
    })

    return { condition, caption, node: transition.node }
  }

  const onUpdate = data => {
    const varName = data.variable ?? currentVarName.current
    const meta = getMeta(varName)
    const args = meta.operator?.fields.map(x => x.key).reduce((acc, curr) => ({ ...acc, [curr]: data[curr] }), {})

    updateRouter(convertToTransition(meta, { ...data, variable: varName, args: args ?? {} }))
  }

  const fields: FormField[] = [
    {
      type: 'select',
      key: 'operator',
      label: lang.tr('studio.router.condition'),
      options: meta.operators ?? [],
      defaultValue: currentItem.operator
    },
    {
      type: 'checkbox',
      key: 'negate',
      label: lang.tr('studio.router.negate')
    },
    ...(meta.operator?.fields ?? [])
  ]

  const advancedSettings = meta.operator?.advancedSettings ?? []

  return (
    <RightSidebar className={style.wrapper} canOutsideClickClose={true} close={close}>
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
                action: deleteTransition,
                type: 'delete'
              }
            ]}
          />
        </div>
        <div className={cx(style.fieldWrapper, style.contentTypeField)}>
          <span className={style.formLabel}>{lang.tr('studio.router.variable')}</span>
          <FormFields.VariablePicker
            field={{ type: 'variable', key: 'value' }}
            placeholder={lang.tr('studio.router.pickVariable')}
            data={{ value: currentVarName.current }}
            variables={variables}
            addVariable={onUpdateVariables}
            variableTypes={variables.primitive.map(x => x.id)}
            onChange={value => {
              currentVarName.current = value
              onUpdate({ ...currentItem, variable: value })
            }}
          />
        </div>

        {currentItem && meta.operators && (
          <Contents.Form
            currentLang={contentLang}
            axios={axios}
            onUpdateVariables={onUpdateVariables}
            variables={variables}
            fields={fields}
            advancedSettings={advancedSettings}
            formData={{ ...currentItem, ...currentItem.args }}
            onUpdate={data => onUpdate({ ...data, variable: currentVarName.current })}
          />
        )}
      </Fragment>
    </RightSidebar>
  )
}

export default RouterForm
