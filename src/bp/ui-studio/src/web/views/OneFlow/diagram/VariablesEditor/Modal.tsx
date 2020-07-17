import { Button, FormGroup, IDialogProps, InputGroup } from '@blueprintjs/core'
import axios from 'axios'
import { FlowVariable, FlowVariableType, FormData } from 'botpress/sdk'
import { Contents, Dialog, Dropdown, lang, Option } from 'botpress/shared'
import React, { FC, useEffect, useState } from 'react'
import { sanitizeName } from '~/util'

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
  const [params, setParams] = useState<FormData>()

  const configsOptions = (variableConfigs || []).map<Option>(c => new Option(lang.tr(c.id), c.id))
  const currentConfigOption = configsOptions.find(o => o.value === type)
  const currentConfig = (variableConfigs || []).find(c => c.id === type)
  const fields = currentConfig?.config?.fields || []
  const advancedSettings = currentConfig?.config?.advancedSettings || []

  useEffect(() => {
    async function fetchVariables() {
      const res = await axios.get(`${window.API_PATH}/modules/variables`)
      setVariableConfigs(res.data)
    }
    // tslint:disable-next-line: no-floating-promises
    fetchVariables()
  }, [])

  useEffect(() => {
    setName(props.variable?.name)
    setType(props.variable?.type)
    setParams(props.variable?.params || {})
  }, [props.variable])

  const handleSaveClick = () => {
    const variable = props.variable
    variable.name = name
    variable.type = type
    variable.params = params
    props.saveChanges(variable)
    props.onClose()
  }

  return (
    <Dialog.Wrapper title="Edit" {...props}>
      <Dialog.Body>
        <FormGroup label="Type">
          <Dropdown items={configsOptions} defaultItem={currentConfigOption} onChange={x => setType(x.value)} />
        </FormGroup>
        <FormGroup label="Name">
          <InputGroup
            value={name || ''}
            onChange={x => setName(sanitizeName(x.currentTarget.value))}
            onSubmit={e => {
              e.preventDefault()
            }}
          />
        </FormGroup>
        <Contents.Form
          fields={fields}
          advancedSettings={advancedSettings}
          formData={props.variable?.params}
          onUpdate={x => setParams(x)}
        />
      </Dialog.Body>
      <Dialog.Footer>
        <Button text="Save" onClick={() => handleSaveClick()} />
      </Dialog.Footer>
    </Dialog.Wrapper>
  )
}

export default VariableModal
