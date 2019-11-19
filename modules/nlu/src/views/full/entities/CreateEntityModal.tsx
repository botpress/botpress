import { Button, Classes, Dialog, FormGroup, HTMLSelect, Intent } from '@blueprintjs/core'
import { NLUApi } from 'api'
import { NLU } from 'botpress/sdk'
import React, { FC, useEffect, useRef, useState } from 'react'

const AVAILABLE_TYPES = [
  {
    label: 'List',
    value: 'list'
  },
  {
    label: 'Pattern',
    value: 'pattern'
  }
]

interface Props {
  api: NLUApi
  visible: boolean
  hide: () => void
  onEntityCreated: (ent: any) => void
}

export const CreateEntityModal: FC<Props> = props => {
  const [name, setName] = useState<string>('')
  const [type, setType] = useState<string>(AVAILABLE_TYPES[0].value)
  const [isValid, setIsValid] = useState<boolean>(false)
  const nameInput = useRef(null)

  useEffect(() => {
    setIsValid(name.trim().length > 0 && type !== undefined)
  }, [name, type])

  const createEntity = e => {
    e.preventDefault()

    const entity = {
      id: name
        .trim()
        .toLowerCase()
        .replace(/[\t\s]/g, '-'),
      name,
      type: type as NLU.EntityType,
      occurences: []
    }
    props.api.createEntity(entity).then(() => {
      setName('')
      setType(AVAILABLE_TYPES[0].value)
      props.onEntityCreated(entity)
      props.hide()
    })
  }

  return (
    <Dialog
      title="Create an entity"
      icon="add"
      isOpen={props.visible}
      onClose={props.hide}
      onOpened={() => nameInput.current.focus()}
      transitionDuration={0}
    >
      <form onSubmit={createEntity}>
        <div className={Classes.DIALOG_BODY}>
          <FormGroup label="Name">
            <input
              required
              ref={nameInput}
              name="name"
              type="text"
              tabIndex={1}
              className={`${Classes.INPUT} ${Classes.FILL}`}
              dir="auto"
              placeholder="Entity name"
              value={name}
              onChange={e => setName(e.target.value)}
            />
          </FormGroup>
          <FormGroup label="Type">
            <HTMLSelect
              tabIndex={2}
              fill
              options={AVAILABLE_TYPES}
              onChange={e => setType(e.target.value)}
              value={type}
            />
          </FormGroup>
        </div>
        <div className={Classes.DIALOG_FOOTER}>
          <div className={Classes.DIALOG_FOOTER_ACTIONS}>
            <Button type="submit" tabIndex={3} intent={Intent.PRIMARY} disabled={!isValid}>
              Create Entity
            </Button>
          </div>
        </div>
      </form>
    </Dialog>
  )
}
