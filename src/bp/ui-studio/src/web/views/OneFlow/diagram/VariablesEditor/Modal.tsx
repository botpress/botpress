import { Button, Checkbox, FormGroup, IDialogProps, InputGroup } from '@blueprintjs/core'
import axios from 'axios'
import { FlowVariable } from 'botpress/sdk'
import { Dialog, Dropdown, lang, Option } from 'botpress/shared'
import { FlowVariableConfig, FlowVariableType, FormField } from 'common/typings'
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
  const [variableConfigs, setVariableConfigs] = useState<FlowVariableType[]>()
  const [name, setName] = useState<string>()
  const [type, setType] = useState<string>()
  const [params, setParams] = useState<any>()

  const configsOptions = (variableConfigs || []).map<Option>(c => new Option(lang.tr(c.id), c.id))
  const currentConfigOption = configsOptions.find(o => o.value === type)
  const currentConfig = (variableConfigs || []).find(c => c.id === type)
  const fields = currentConfig?.config?.fields || []

  useEffect(() => {
    async function fetchVariables() {
      const res = await axios.get(`${window.API_PATH}/modules/variables`)
      setVariableConfigs(res.data)
      console.log(res.data)
    }
    fetchVariables()
  }, [])

  useEffect(() => {
    setName(props.variable?.name)
    setType(props.variable?.type)
    setParams(props.variable?.params || {})
  }, [props.variable])

  const setParameter = (param: FormField, value) => {
    const newParams = { ...params }
    newParams[param.key] = value
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

  const renderParameter = (param: FormField) => {
    if (param.type === 'checkbox') {
      return renderNullableCheckboxParameter(param)
    } else {
      return renderTextboxParameter(param)
    }
  }

  const renderTextboxParameter = (param: FormField) => {
    return (
      <FormGroup key={param.key} label={lang.tr(param.label)}>
        <InputGroup value={params[param.key] || ''} onChange={x => setParameter(param, x.currentTarget.value)} />
      </FormGroup>
    )
  }

  const renderNullableCheckboxParameter = (param: FormField) => {
    const currentBoolOption = boolOptions.find(b => b.value === params[param.key]) || boolOptions[0]
    return (
      <div key={param.key}>
        <Checkbox
          key={param.key}
          checked={params[param.key] !== undefined}
          onChange={x => setParameter(param, x.currentTarget.checked ? true : undefined)}
          label={lang.tr(param.label)}
        />
        {params[param.key] && (
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
          {fields.map(param => renderParameter(param))}
        </form>
      </Dialog.Body>
      <Dialog.Footer>
        <Button text="Save" onClick={() => handleSaveClick()} />
      </Dialog.Footer>
    </Dialog.Wrapper>
  )
}

export default VariableModal
