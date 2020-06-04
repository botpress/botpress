import { Button, FormGroup, IDialogProps, InputGroup } from '@blueprintjs/core'
import { FlowVariable } from 'botpress/sdk'
import { Dialog } from 'botpress/shared'
import React, { FC, useEffect, useState } from 'react'

type Props = {
  variable: FlowVariable
  saveChanges: (variable: FlowVariable) => void
} & IDialogProps

const VariableModal: FC<Props> = props => {
  const [name, setName] = useState<string>()
  const [type, setType] = useState<string>()

  useEffect(() => {
    setName(props.variable?.name)
    setType(props.variable?.type)
  }, [props.variable])

  const handleSaveClick = () => {
    const variable = props.variable
    variable.name = name
    variable.type = type
    props.saveChanges(variable)
    props.onClose()
  }

  return (
    <Dialog.Wrapper title="Edit" {...props}>
      <Dialog.Body>
        <form>
          <FormGroup label="Name">
            <InputGroup value={name || ''} onChange={x => setName(x.currentTarget.value)} />
          </FormGroup>
          <FormGroup label="Type">
            <InputGroup value={type || ''} onChange={x => setType(x.currentTarget.value)} />
          </FormGroup>
        </form>
      </Dialog.Body>
      <Dialog.Footer>
        <Button text="Save" onClick={() => handleSaveClick()} />
      </Dialog.Footer>
    </Dialog.Wrapper>
  )
}

export default VariableModal
