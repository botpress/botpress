import axios from 'axios'
import { FlowVariable, PromptNode } from 'botpress/sdk'
import {
  Contents,
  Dropdown,
  FormFields,
  lang,
  MainContent,
  MoreOptions,
  MoreOptionsItems,
  sharedStyle,
  Tabs
} from 'botpress/shared'
import cx from 'classnames'
import { Prompts, Variables } from 'common/typings'
import _ from 'lodash'
import React, { FC, Fragment, useEffect, useRef, useState } from 'react'

interface Props {
  deletePrompt: () => void
  prompts: Prompts
  variables: Variables
  customKey: string
  defaultLang: string
  contentLang: string
  close: () => void
  onUpdate: (data: any) => void
  formData: PromptNode
  onUpdateVariables: (variable: FlowVariable) => void
}

const PromptForm: FC<Props> = ({
  customKey,
  prompts,
  defaultLang,
  contentLang,
  close,
  formData,
  onUpdate,
  deletePrompt,
  onUpdateVariables,
  variables
}) => {
  const promptType = useRef(formData?.type)
  const promptSubType = useRef(formData?.params?.subType)
  const currentVarName = useRef<string>(formData?.params?.output)
  const [isConfirming, setIsConfirming] = useState(false)
  const [showOptions, setShowOptions] = useState(false)
  const [forceUpdate, setForceUpdate] = useState(false)

  useEffect(() => {
    promptType.current = formData?.type
    currentVarName.current = formData.params.output
    setForceUpdate(!forceUpdate)
  }, [customKey])

  const moreOptionsItems: MoreOptionsItems[] = [
    {
      label: lang.tr('deletePrompt'),
      action: deletePrompt,
      type: 'delete'
    }
  ]

  const handleTypeChange = ({ type, subType }) => {
    promptType.current = type
    promptSubType.current = subType

    onUpdate({
      type,
      params: { output: undefined, subType }
    })
  }

  const handleVariablePicked = (value: string) => {
    currentVarName.current = value

    if (!promptType.current) {
      const variableInfo = variables.currentFlow.find(x => x.params.name === value)

      promptType.current = variableInfo.type
      promptSubType.current = variableInfo.params.subType
    }

    onUpdate({
      params: { ...formData?.params, output: value, subType: promptSubType.current },
      type: promptType.current
    })
  }

  const selectedPromptType = prompts.primitive.find(x => x.id === promptType.current)

  const options = prompts.display.map(x => ({ label: lang.tr(x.label), icon: x.icon, value: x }))
  const selectedOption = options.find(
    ({ value }) =>
      value.type === promptType.current && (!promptSubType.current || value.subType === promptSubType.current)
  )

  const variableTypes = selectedOption ? [selectedOption.value.variableType] : variables.primitive.map(x => x.id)
  const variableSubType = selectedOption?.value?.subType

  return (
    <MainContent.RightSidebar
      className={sharedStyle.wrapper}
      canOutsideClickClose={!isConfirming}
      close={() => close()}
    >
      <Fragment key={`${promptType.current}-${contentLang}-${customKey}`}>
        <div className={sharedStyle.formHeader}>
          <Tabs tabs={[{ id: 'content', title: lang.tr('studio.flow.nodeType.prompt') }]} />
          <MoreOptions show={showOptions} onToggle={setShowOptions} items={moreOptionsItems} />
        </div>
        <div>
          <span className={sharedStyle.formLabel}>{lang.tr('studio.prompt.label')}</span>
          {!!prompts.primitive.length && (
            <Dropdown
              filterable
              className={sharedStyle.formSelect}
              placeholder={lang.tr('studio.prompt.pickType')}
              items={options}
              defaultItem={selectedOption}
              hideActiveItemIcon
              rightIcon="chevron-down"
              onChange={({ value }) => handleTypeChange(value)}
            />
          )}
        </div>
        <div className={cx(sharedStyle.fieldWrapper, sharedStyle.typeField)}>
          <span className={sharedStyle.formLabel}>{lang.tr('module.builtin.setValueTo')}</span>
          {!!prompts.primitive.length && (
            <FormFields.VariablePicker
              field={{ type: 'variable', key: 'output' }}
              placeholder={lang.tr('module.builtin.setValueToPlaceholder')}
              data={{ output: currentVarName.current }}
              variables={variables}
              addVariable={onUpdateVariables}
              variableTypes={variableTypes}
              defaultVariableType={variableTypes?.[0]}
              variableSubType={variableSubType}
              onChange={value => handleVariablePicked(value)}
            />
          )}
        </div>
        {selectedPromptType && (
          <div className={sharedStyle.fieldWrapper}>
            <Contents.Form
              currentLang={contentLang}
              defaultLang={defaultLang}
              axios={axios}
              onUpdateVariables={onUpdateVariables}
              variables={variables}
              fields={selectedPromptType.config?.fields || []}
              advancedSettings={selectedPromptType.config?.advancedSettings || []}
              formData={formData?.params || {}}
              onUpdate={data => {
                onUpdate({ params: { ...data, output: currentVarName.current }, type: promptType.current })
              }}
            />
          </div>
        )}
      </Fragment>
    </MainContent.RightSidebar>
  )
}

export default PromptForm
