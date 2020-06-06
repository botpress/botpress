import { Button, Checkbox, FormGroup, IDialogProps, InputGroup } from '@blueprintjs/core'
import axios from 'axios'
import { FlowVariable, FlowVariableConfig, FlowVariableParameter } from 'botpress/sdk'
import { Dialog, Dropdown, lang, Option } from 'botpress/shared'
import React, { FC, Fragment, useEffect, useState } from 'react'

type Props = {
  variable: FlowVariable
  saveChanges: (variable: FlowVariable) => void
} & IDialogProps

const boolOptions: Option[] = [
  { label: 'True', value: 'true' },
  { label: 'False', value: 'false' }
]

const VariableModal: FC<Props> = props => {
  const [variableConfigs, setVariableConfigs] = useState<FlowVariableConfig[]>()
  const [name, setName] = useState<string>()
  const [type, setType] = useState<string>()
  const [params, setParams] = useState<any>()

  const configsOptions = (variableConfigs || []).map<Option>(c => new Option(lang.tr(c.label), c.name))
  const currentConfigOption = configsOptions.find(o => o.value === type)
  const currentConfig = (variableConfigs || []).find(c => c.name === type)
  const normalParams = (currentConfig?.params || []).filter(p => !p.isAdvanced)
  const advancedParams = (currentConfig?.params || []).filter(p => p.isAdvanced)

  useEffect(() => {
    async function fetchVariables() {
      const res = await axios.get(`${window.API_PATH}/modules/variables`)
      setVariableConfigs(res.data)
    }
    fetchVariables()
  }, [])

  useEffect(() => {
    setName(props.variable?.name)
    setType(props.variable?.type)
    setParams(props.variable?.params || {})
  }, [props.variable])

  const setParameter = (param: FlowVariableParameter, value) => {
    const newParams = { ...params }
    newParams[param.name] = value
    setParams(newParams)
  }

  const handleSaveClick = () => {
    const variable = props.variable
    variable.name = name
    variable.type = type
    variable.params = params
    props.saveChanges(variable)
    props.onClose()
  }

  const renderParameter = (param: FlowVariableParameter) => {
    if (param.control === 'nullableCheckbox') {
      return renderNullableCheckboxParameter(param)
    } else {
      return renderTextboxParameter(param)
    }
  }

  const renderTextboxParameter = (param: FlowVariableParameter) => {
    return (
      <FormGroup key={param.name} label={lang.tr(param.label)}>
        <InputGroup value={params[param.name] || ''} onChange={x => setParameter(param, x.currentTarget.value)} />
      </FormGroup>
    )
  }

  const renderNullableCheckboxParameter = (param: FlowVariableParameter) => {
    const currentBoolOption = boolOptions.find(b => b.value === params[param.name]) || boolOptions[0]
    return (
      <div key={param.name}>
        <Checkbox
          key={param.name}
          checked={params[param.name] !== undefined}
          onChange={x => setParameter(param, x.currentTarget.checked ? true : undefined)}
          label={lang.tr(param.label)}
        />
        {params[param.name] && (
          <Dropdown items={boolOptions} defaultItem={currentBoolOption} onChange={x => setParameter(param, x.value)} />
        )}
      </div>
    )
  }

  return (
    <Dialog.Wrapper title="Edit" {...props}>
      <Dialog.Body>
        <form>
          <FormGroup label="Type">
            <Dropdown items={configsOptions} defaultItem={currentConfigOption} onChange={x => setType(x.value)} />
          </FormGroup>
          <FormGroup label="Name">
            <InputGroup value={name || ''} onChange={x => setName(x.currentTarget.value)} />
          </FormGroup>
          {normalParams.map(param => renderParameter(param))}
          {advancedParams.length > 0 && (
            <Fragment>
              <span>Advanced Parameters</span>
              {advancedParams.map(param => renderParameter(param))}
            </Fragment>
          )}
        </form>
      </Dialog.Body>
      <Dialog.Footer>
        <Button text="Save" onClick={() => handleSaveClick()} />
      </Dialog.Footer>
    </Dialog.Wrapper>
  )
}

export default VariableModal
