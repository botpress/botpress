import { Button, FormGroup, InputGroup, Intent, TextArea } from '@blueprintjs/core'
import axios from 'axios'
import { Dialog, lang } from 'botpress/shared'
import _ from 'lodash'
import React, { FC, useState } from 'react'
import { connect } from 'react-redux'
import { fetchTopics } from '~/actions'
import { RootReducer } from '~/reducers'
import { sanitizeName } from '~/util'

type StateProps = ReturnType<typeof mapStateToProps>
type DispatchProps = typeof mapDispatchToProps

interface OwnProps {
  isOpen: boolean

  toggle: () => void
  onCreateFlow: (name: string) => void
}

type Props = OwnProps & StateProps & DispatchProps

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
    <Dialog.Wrapper
      title={lang.tr('studio.flow.topicEditor.createNewTopic')}
      icon="add"
      isOpen={props.isOpen}
      onClose={closeModal}
      size="sm"
      onSubmit={submit}
    >
      <Dialog.Body>
        <FormGroup
          label={lang.tr('studio.flow.topicEditor.topicName')}
          helperText={lang.tr('studio.flow.topicEditor.topicNameHelp')}
        >
          <InputGroup
            id="input-flow-name"
            tabIndex={1}
            value={name}
            maxLength={50}
            onChange={e => setName(sanitizeName(e.currentTarget.value))}
          />
        </FormGroup>

        <FormGroup label={lang.tr('description')}>
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
      </Dialog.Body>
      <Dialog.Footer>
        <Button
          text={lang.tr('studio.flow.topicEditor.createTopic')}
          tabIndex={3}
          intent={Intent.PRIMARY}
          type="submit"
          disabled={!name}
        />
      </Dialog.Footer>
    </Dialog.Wrapper>
  )
}

const mapStateToProps = (state: RootReducer) => ({
  topics: state.ndu.topics
})

const mapDispatchToProps = {
  fetchTopics
}

export default connect<StateProps, DispatchProps, OwnProps>(mapStateToProps, mapDispatchToProps)(CreateTopicModal)
