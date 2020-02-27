import { Button, FormGroup, InputGroup, Intent, Tab, Tabs, TextArea } from '@blueprintjs/core'
import { Condition, Flow, FlowTrigger } from 'botpress/sdk'
import _ from 'lodash'
import React, { FC, useEffect, useState } from 'react'
import { connect } from 'react-redux'
import { createFlow, renameFlow, updateFlow } from '~/actions'
import { BaseDialog, DialogBody } from '~/components/Shared/Interface'
import { getCurrentFlow } from '~/reducers'
import { sanitizeName } from '~/util'

import style from '../style.scss'

import TriggerEditor from './TriggerEditor'

interface OwnProps {
  isOpen: boolean
  selectedGoal?: string
  readOnly: boolean
  canRename: boolean
  selectedTopic?: string
  toggle: () => void
}

interface StateProps {
  conditions: Condition[]
  flows: Flow[]
}

interface DispatchProps {
  updateFlow: (params: any) => void
  renameFlow: (flow: { targetFlow: string; name: string }) => void
  createFlow: (name: string) => void
}

type Props = StateProps & DispatchProps & OwnProps

const EditGoalModal: FC<Props> = props => {
  const [tab, setTab] = useState('overview')

  const [name, setName] = useState<string>('')
  const [label, setLabel] = useState<string>('')
  const [description, setDescription] = useState<string>('')
  const [triggers, setTriggers] = useState<FlowTrigger[]>([])

  useEffect(() => {
    setTab('overview')

    const originalFlow = props.flows.find(x => x.name === props.selectedGoal)
    if (originalFlow) {
      const { name, label, description, triggers } = originalFlow

      setName(name.replace(/\.flow\.json$/i, ''))
      setLabel(label || '')
      setDescription(description || '')
      setTriggers(triggers)
    } else {
      setName(props.selectedTopic ? props.selectedTopic + '/' : '')
      setLabel('')
      setDescription('')
      setTriggers([])
    }
  }, [props.isOpen])

  const submit = async () => {
    const fullName = `${name}.flow.json`

    if (isCreate) {
      props.createFlow(fullName)
    } else {
      const originalFlow = props.flows.find(x => x.name === props.selectedGoal)

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
    setTriggers([])
    props.toggle()
  }

  const isCreate = !props.selectedGoal

  let dialog: { icon: any; title: string } = { icon: 'add', title: 'Create Goal' }
  if (!isCreate) {
    dialog = { icon: 'edit', title: `Edit Goal - ${props.selectedGoal}` }
  }

  return (
    <BaseDialog
      isOpen={props.isOpen}
      onClose={closeModal}
      onSubmit={submit}
      style={{ width: 900, minHeight: 450 }}
      {...dialog}
    >
      <DialogBody>
        <div style={{ minHeight: 300 }}>
          <Tabs id="tabs" vertical={true} onChange={tab => setTab(tab as string)} selectedTabId={tab}>
            <Tab
              id="overview"
              title="Overview"
              className={style.tabs}
              panel={
                <div>
                  <FormGroup label="Name" helperText="The name is used internally">
                    <InputGroup
                      id="input-flow-name"
                      tabIndex={1}
                      required={true}
                      value={name}
                      onChange={e => setName(sanitizeName(e.currentTarget.value))}
                      autoFocus={true}
                    />
                  </FormGroup>

                  <FormGroup
                    label="Label"
                    helperText="The label is a friendly name that can replace the name in the topic list"
                  >
                    <InputGroup
                      id="input-flow-label"
                      tabIndex={2}
                      value={label}
                      onChange={e => setLabel(e.currentTarget.value)}
                    />
                  </FormGroup>

                  <FormGroup label="Description">
                    <TextArea
                      id="input-flow-name"
                      rows={3}
                      tabIndex={3}
                      value={description}
                      fill={true}
                      onChange={e => setDescription(e.currentTarget.value)}
                    />
                  </FormGroup>

                  <Button
                    type="submit"
                    id="btn-submit"
                    tabIndex={4}
                    text="Save changes"
                    intent={Intent.PRIMARY}
                    className={style.modalFooter}
                  />
                </div>
              }
            />

            <Tab
              id="triggers"
              title="Triggers"
              className={style.tabs}
              panel={
                <div style={{ width: '740px' }}>
                  <TriggerEditor
                    goalName={name}
                    selectedTopic={props.selectedTopic}
                    triggers={triggers}
                    closeModal={closeModal}
                  />
                </div>
              }
            />
          </Tabs>
        </div>
      </DialogBody>
    </BaseDialog>
  )
}

const mapStateToProps = state => ({
  conditions: state.ndu.conditions,
  flows: _.values(state.flows.flowsByName)
})

export default connect<StateProps, DispatchProps, OwnProps>(mapStateToProps, { updateFlow, renameFlow, createFlow })(
  EditGoalModal
)
