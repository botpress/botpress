import { Button, Callout, Classes, Dialog, FormGroup, HTMLSelect, Intent } from '@blueprintjs/core'
import { NLU } from 'botpress/sdk'
import { lang } from 'botpress/shared'
import _ from 'lodash'
import React, { FC, useEffect, useState } from 'react'

import { NluClient } from '../client'

const AVAILABLE_TYPES = [
  {
    label: lang.tr('list'),
    value: 'list'
  },
  {
    label: lang.tr('pattern'),
    value: 'pattern'
  }
]

interface Props {
  api: NluClient
  // Used for actions rename and duplicate
  originalEntity?: NLU.EntityDefinition
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
    props.action === 'rename' ? setName(props.originalEntity.name) : setName('')
  }, [props.isOpen])

  const submit = async e => {
    e.preventDefault()

    if (props.action === 'create') {
      await onCreateEntity()
    } else if (props.action === 'duplicate') {
      await onDuplicateEntity()
    } else if (props.action === 'rename') {
      await onRenameEntity()
    }

    props.closeModal()
  }

  const onCreateEntity = async () => {
    const entity = {
      id: getEntityId(name),
      name: name.trim(),
      type: type as NLU.EntityType,
      occurrences: []
    }
    await props.api.createEntity(entity)
    props.onEntityModified(entity)
  }

  const onRenameEntity = async () => {
    const entity = _.cloneDeep(props.originalEntity)
    entity.name = name.trim()
    entity.id = getEntityId(name)
    await props.api.updateEntity(getEntityId(props.originalEntity.name), entity)
    props.onEntityModified(entity)
  }

  const getEntityId = (entityName: string) =>
    entityName
      .trim()
      .toLowerCase()
      .replace(/[\t\s]/g, '-')

  const onDuplicateEntity = async () => {
    const clone = _.cloneDeep(props.originalEntity)
    clone.name = name.trim()
    clone.id = getEntityId(name)
    await props.api.createEntity(clone)
    props.onEntityModified(clone)
  }

  const isIdentical = props.action === 'rename' && props.originalEntity.name === name
  const alreadyExists = !isIdentical && _.some(props.entityIDs, id => id === getEntityId(name))

  let dialog: { icon: any; title: string } = { icon: 'add', title: lang.tr('create') }
  let submitText = lang.tr('create')
  if (props.action === 'duplicate') {
    dialog = { icon: 'duplicate', title: lang.tr('nlu.entities.duplicate') }
    submitText = lang.tr('duplicate')
  } else if (props.action === 'rename') {
    dialog = { icon: 'edit', title: lang.tr('nlu.entities.rename') }
    submitText = lang.tr('rename')
  }

  return (
    <Dialog isOpen={props.isOpen} onClose={props.closeModal} transitionDuration={0} {...dialog}>
      <form onSubmit={submit}>
        <div className={Classes.DIALOG_BODY}>
          <FormGroup label={lang.tr('name')}>
            <input
              required
              name="name"
              type="text"
              tabIndex={1}
              className={`${Classes.INPUT} ${Classes.FILL}`}
              dir="auto"
              placeholder={lang.tr('nlu.entities.namePlaceholder')}
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
            <Callout title={lang.tr('nlu.entities.nameConflictTitle')} intent={Intent.DANGER}>
              {lang.tr('nlu.entities.nameConflictMessage')}
            </Callout>
          )}
        </div>
        <div className={Classes.DIALOG_FOOTER}>
          <div className={Classes.DIALOG_FOOTER_ACTIONS}>
            <Button
              id="entity-submit"
              type="submit"
              tabIndex={3}
              intent={Intent.PRIMARY}
              text={submitText}
              disabled={!isValid || isIdentical || alreadyExists}
            />
          </div>
        </div>
      </form>
    </Dialog>
  )
}
