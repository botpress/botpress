import { Button, FormGroup, IDialogProps, InputGroup } from '@blueprintjs/core'
import axios from 'axios'
import { NLU } from 'botpress/sdk'
import { Dialog } from 'botpress/shared'
import React, { FC, useEffect, useState } from 'react'
import { sanitizeName } from '~/util'

type Props = {
  entity: NLU.EntityDefinition
} & IDialogProps

const EntityNameModal: FC<Props> = props => {
  const [name, setName] = useState<string>('')

  useEffect(() => {
    setName(props.entity?.name ?? '')
  }, [props.entity])

  const handleSaveClick = async () => {
    const oldId = props.entity.id
    props.entity.name = name.trim()
    props.entity.id = sanitizeName(name)
    await axios.post(`${window.BOT_API_PATH}/nlu/entities/${oldId}`, props.entity)

    props.onClose()
  }

  return (
    <Dialog.Wrapper title="Rename" {...props}>
      <Dialog.Body>
        <FormGroup label="Name">
          <InputGroup value={name || ''} onChange={x => setName(x.currentTarget.value)} />
        </FormGroup>
      </Dialog.Body>
      <Dialog.Footer>
        <Button text="Save" onClick={() => handleSaveClick()} />
      </Dialog.Footer>
    </Dialog.Wrapper>
  )
}

export default EntityNameModal
