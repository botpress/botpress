import { Button, Callout, Classes, Dialog, FormGroup, HTMLSelect, Intent } from '@blueprintjs/core'
import { NLUApi } from 'api'
import { NLU } from 'botpress/sdk'
import _ from 'lodash'
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
  // Used for actions rename and duplicate
  originalName?: string
  action: 'create' | 'rename' | 'duplicate'
  entityIDs: string[]
  isOpen: boolean
  closeModal: () => void
  onEntityModified: (ent: any) => void
}

export const EntityNameModal: FC<Props> = props => {
  const [name, setName] = useState<string>('')
  const [type, setType] = useState<string>(AVAILABLE_TYPES[0].value)
  const [isValid, setIsValid] = useState<boolean>()

  useEffect(() => {
    setIsValid(name.trim().length > 0 && type !== undefined)
  }, [name, type])

  useEffect(() => {
    props.action === 'rename' ? setName(props.originalName) : setName('')
  }, [props.isOpen])

  const submit = async e => {
    e.preventDefault()

    if (props.action === 'create') {
      onCreateEntity()
    } else if (props.action === 'duplicate') {
      onDuplicateEntity()
    } else if (props.action === 'rename') {
      onRenameEntity()
    }

    props.closeModal()
  }

  const onCreateEntity = () => {
    const entity = {
      id: getEntityId(name),
      name: name.trim(),
      type: type as NLU.EntityType,
      occurences: []
    }
    props.api.createEntity(entity).then(() => {
      props.onEntityModified(entity)
    })
  }

  const onRenameEntity = async () => {
    const entity = await props.api.fetchEntity(props.originalName)
    entity.name = name.trim()
    entity.id = getEntityId(name)
    props.api.updateEntity(getEntityId(props.originalName), entity).then(() => props.onEntityModified(entity))
  }

  const getEntityId = (entityName: string) => entityName.trim().toLowerCase().replace(/[\t\s]/g, '-')

  const onDuplicateEntity = async () => {
    const entity = await props.api.fetchEntity(props.originalName)
    const clone = _.cloneDeep(entity)
    clone.name = name.trim()
    clone.id = getEntityId(name)
    props.api.createEntity(clone).then(() => props.onEntityModified(clone))
  }

  const isIdentical = props.action === 'rename' && props.originalName === name
  const alreadyExists = !isIdentical && _.some(props.entityIDs, id => id === getEntityId(name))

  let dialog: { icon: any; title: string } = { icon: 'add', title: 'Create Entity' }
  if (props.action === 'duplicate') {
    dialog = { icon: 'duplicate', title: 'Duplicate Entity' }
  } else if (props.action === 'rename') {
    dialog = { icon: 'edit', title: 'Rename Entity' }
  }

  return (
    <Dialog
      isOpen={props.isOpen}
      onClose={props.closeModal}
      transitionDuration={0}
      {...dialog}
    >
      <form onSubmit={submit}>
        <div className={Classes.DIALOG_BODY}>
          <FormGroup label="Name">
            <input
              required
              name="name"
              type="text"
              tabIndex={1}
              className={`${Classes.INPUT} ${Classes.FILL}`}
              dir="auto"
              placeholder="Entity name"
              value={name}
              onChange={e => setName(e.target.value)}
              autoFocus
            />
          </FormGroup>
          {props.action === 'create' && (
            <FormGroup label="Type">
              <HTMLSelect
                tabIndex={2}
                fill
                options={AVAILABLE_TYPES}
                onChange={e => setType(e.target.value)}
                value={type}
              />
            </FormGroup>
          )}

          {alreadyExists && (
            <Callout title="Name already in use" intent={Intent.DANGER}>
              An entity with that name already exists. Please choose another one.
            </Callout>
          )}
        </div>
        <div className={Classes.DIALOG_FOOTER}>
          <div className={Classes.DIALOG_FOOTER_ACTIONS}>
            <Button
              type="submit"
              tabIndex={3}
              intent={Intent.PRIMARY}
              text="Submit"
              disabled={!isValid || isIdentical || alreadyExists}
            />
          </div>
        </div>
      </form>
    </Dialog>
  )
}
