import { Button, IDialogProps } from '@blueprintjs/core'
import { NLU } from 'botpress/sdk'
import { Dialog } from 'botpress/shared'
import React, { FC } from 'react'
import InjectedModuleView from '~/components/PluginInjectionSite/module'

type Props = {
  entities: NLU.EntityDefinition[]
  entity: NLU.EntityDefinition
  updateEntity: (targetEntity: string, entity: NLU.EntityDefinition) => void
} & IDialogProps

const EntityModal: FC<Props> = props => {
  const handleSaveClick = () => {
    props.onClose()
  }

  return (
    <Dialog.Wrapper title="Edit" size="lg" {...props}>
      <Dialog.Body>
        <InjectedModuleView moduleName="nlu" componentName="EntityEditor" extraProps={{ ...props }} />
      </Dialog.Body>
      <Dialog.Footer>
        <Button text="Save" onClick={() => handleSaveClick()} />
      </Dialog.Footer>
    </Dialog.Wrapper>
  )
}

export default EntityModal
