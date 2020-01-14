import { Button, FormGroup, InputGroup, Intent } from '@blueprintjs/core'
import { Topic } from 'botpress/sdk'
import _ from 'lodash'
import React, { FC, useState } from 'react'
import { BaseDialog, DialogBody, DialogFooter } from '~/components/Shared/Interface'
import { sanitizeName } from '~/util'

interface Props {
  isOpen: boolean
  topics: Topic[]

  toggle: () => void
  onCreateFlow: (goalName: string) => void
  updateTopics: (topics: Topic[]) => Promise<void>
}

const CreateTopicModal: FC<Props> = props => {
  const [name, setName] = useState('')
  const [goal, setGoal] = useState('')

  const submit = async () => {
    const goalName = `${name}/${goal}`

    props.onCreateFlow(goalName)
    await props.updateTopics([...props.topics, { name: goalName, description: '' }])

    closeModal()
  }

  const closeModal = () => {
    setName('')
    setGoal('')
    props.toggle()
  }

  return (
    <BaseDialog
      title="Create a new topic"
      icon="add"
      isOpen={props.isOpen}
      onClose={closeModal}
      size="md"
      style={{ width: 500, minHeight: 350 }}
      onSubmit={submit}
    >
      <DialogBody>
        <FormGroup label="Topic Name" helperText="Choose a broad name to represent your topic, for example HR or IT">
          <InputGroup
            id="input-flow-name"
            tabIndex={1}
            value={name}
            onChange={e => setName(sanitizeName(e.currentTarget.value))}
          />
        </FormGroup>

        <FormGroup
          label="First Goal"
          helperText="To get started, choose one goal you'd like your users to achieve, for example: hire_new_employee"
        >
          <InputGroup
            id="input-flow-name"
            tabIndex={1}
            value={goal}
            onChange={e => setGoal(sanitizeName(e.currentTarget.value))}
          />
        </FormGroup>
      </DialogBody>
      <DialogFooter>
        <Button text="Create topic" intent={Intent.PRIMARY} type="submit" disabled={!goal && !name} />
      </DialogFooter>
    </BaseDialog>
  )
}

export default CreateTopicModal
