import { Button, FormGroup, InputGroup, Intent, TextArea } from '@blueprintjs/core'
import axios from 'axios'
import { Topic } from 'botpress/sdk'
import _ from 'lodash'
import React, { FC, useState } from 'react'
import { connect } from 'react-redux'
import { fetchTopics } from '~/actions'
import { BaseDialog, DialogBody, DialogFooter } from '~/components/Shared/Interface'
import { sanitizeName } from '~/util'

interface Props {
  isOpen: boolean
  topics: Topic[]

  toggle: () => void
  onCreateFlow: (name: string) => void
  fetchTopics: () => void
}

const CreateTopicModal: FC<Props> = props => {
  const [name, setName] = useState('')
  const [description, setDescription] = useState<string>('')

  const submit = async () => {
    await axios.post(`${window.BOT_API_PATH}/topic`, { name, description })
    props.fetchTopics()

    closeModal()
  }

  const closeModal = () => {
    setName('')
    setDescription('')
    props.toggle()
  }

  return (
    <BaseDialog
      title="Create a new topic"
      icon="add"
      isOpen={props.isOpen}
      onClose={closeModal}
      size="sm"
      onSubmit={submit}
    >
      <DialogBody>
        <FormGroup
          label="Topic Name *"
          helperText="Choose a broad name to represent your topic, for example HR or IT. You can rename it later"
        >
          <InputGroup
            id="input-flow-name"
            tabIndex={1}
            value={name}
            maxLength={50}
            onChange={e => setName(sanitizeName(e.currentTarget.value))}
          />
        </FormGroup>

        <FormGroup label="Description">
          <TextArea
            id="input-flow-description"
            rows={3}
            tabIndex={2}
            value={description}
            maxLength={250}
            fill={true}
            onChange={e => setDescription(e.currentTarget.value)}
          />
        </FormGroup>
      </DialogBody>
      <DialogFooter>
        <Button text="Create topic" tabIndex={3} intent={Intent.PRIMARY} type="submit" disabled={!name} />
      </DialogFooter>
    </BaseDialog>
  )
}

const mapStateToProps = state => ({
  topics: state.ndu.topics
})

const mapDispatchToProps = {
  fetchTopics
}

export default connect(mapStateToProps, mapDispatchToProps)(CreateTopicModal)
