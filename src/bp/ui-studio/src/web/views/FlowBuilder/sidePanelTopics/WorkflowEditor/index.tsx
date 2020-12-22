import { Button, FormGroup, InputGroup, Intent, TextArea } from '@blueprintjs/core'
import { Option } from 'botpress/sdk'
import { Dialog, Dropdown, lang } from 'botpress/shared'
import _ from 'lodash'
import React, { FC, useEffect, useState } from 'react'
import { connect } from 'react-redux'
import { createFlow, renameFlow, updateFlow } from '~/actions'
import { RootReducer } from '~/reducers'
import { sanitizeName } from '~/util'

import { buildFlowName, parseFlowName } from './utils'

interface OwnProps {
  isOpen: boolean
  selectedWorkflow?: string
  readOnly: boolean
  canRename: boolean
  selectedTopic?: string
  toggle: () => void
}

type StateProps = ReturnType<typeof mapStateToProps>
type DispatchProps = typeof mapDispatchToProps

type Props = StateProps & DispatchProps & OwnProps

const WorkflowEditor: FC<Props> = props => {
  const [topic, setTopic] = useState<Option>()
  const [name, setName] = useState<string>('')
  const [label, setLabel] = useState<string>('')
  const [description, setDescription] = useState<string>('')

  const items = props.topics.map(x => ({ label: x.name, value: x.name }))

  useEffect(() => {
    const originalFlow = props.flows.find(x => x.name === props.selectedWorkflow)
    if (originalFlow) {
      const { name, label, description } = originalFlow

      const parsed = parseFlowName(name, true)

      setTopic(items.find(x => x.value === parsed.topic))
      setName(parsed.workflow)
      setLabel(label || '')
      setDescription(description || '')
    } else {
      setTopic(items.find(x => x.value === props.selectedTopic))
      setName('')
      setLabel('')
      setDescription('')
    }
  }, [props.isOpen])

  const submit = async () => {
    const fullName = buildFlowName({ topic: topic?.value, workflow: name }, true)

    if (isCreate) {
      props.createFlow(fullName)
    } else {
      const originalFlow = props.flows.find(x => x.name === props.selectedWorkflow)

      // TODO: fix flow edition
      if (originalFlow.name !== fullName) {
        props.renameFlow({ targetFlow: originalFlow.name, name: fullName })
      }
      props.updateFlow({ name: fullName, description, label })
    }

    closeModal()
  }

  const closeModal = () => {
    setName('')
    setLabel('')
    setDescription('')
    props.toggle()
  }

  const isCreate = !props.selectedWorkflow

  let dialog: { icon: any; title: string } = { icon: 'add', title: lang.tr('studio.flow.workflow.create') }
  if (!isCreate) {
    dialog = {
      icon: 'edit',
      title: lang.tr('studio.flow.workflow.edit', { name: parseFlowName(props.selectedWorkflow).workflow })
    }
  }

  return (
    <Dialog.Wrapper isOpen={props.isOpen} onClose={closeModal} onSubmit={submit} {...dialog}>
      <Dialog.Body>
        <div>
          <div style={{ display: 'flex' }}>
            <FormGroup label={lang.tr('studio.flow.topic')}>
              <Dropdown items={items} onChange={item => setTopic(item)} defaultItem={topic} />
            </FormGroup>
            <FormGroup label={lang.tr('studio.flow.workflow.name')} style={{ marginLeft: 10, flexGrow: 2 }}>
              <InputGroup
                id="input-flow-name"
                tabIndex={1}
                fill={true}
                required
                value={name || ''}
                onChange={e => setName(sanitizeName(e.currentTarget.value))}
                autoFocus
              />
            </FormGroup>
          </div>

          <FormGroup label={lang.tr('label')} helperText={lang.tr('studio.flow.workflow.labelHelp')}>
            <InputGroup
              id="input-flow-label"
              tabIndex={2}
              value={label || ''}
              onChange={e => setLabel(e.currentTarget.value)}
            />
          </FormGroup>

          <FormGroup label={lang.tr('description')}>
            <TextArea
              id="input-flow-description"
              rows={3}
              tabIndex={3}
              value={description || ''}
              fill
              onChange={e => setDescription(e.currentTarget.value)}
            />
          </FormGroup>
        </div>
      </Dialog.Body>
      <Dialog.Footer>
        <Button type="submit" id="btn-submit" tabIndex={4} text={lang.tr('saveChanges')} intent={Intent.PRIMARY} />
      </Dialog.Footer>
    </Dialog.Wrapper>
  )
}

const mapStateToProps = (state: RootReducer) => ({
  flows: _.values(state.flows.flowsByName),
  topics: state.ndu.topics
})

const mapDispatchToProps = { updateFlow, renameFlow, createFlow }

export default connect<StateProps, DispatchProps, OwnProps>(mapStateToProps, mapDispatchToProps)(WorkflowEditor)
