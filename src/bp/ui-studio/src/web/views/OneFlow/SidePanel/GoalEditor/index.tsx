import { Button, FormGroup, InputGroup, Intent, Tab, Tabs, TextArea } from '@blueprintjs/core'
import { Condition, Flow, FlowTrigger } from 'botpress/sdk'
import _ from 'lodash'
import React, { FC, useEffect, useState } from 'react'
import { connect } from 'react-redux'
import { renameFlow, updateFlow } from '~/actions'
import { BaseDialog, DialogBody } from '~/components/Shared/Interface'
import { getCurrentFlow } from '~/reducers'

import style from '../style.scss'

import TriggerEditor from './TriggerEditor'

interface OwnProps {
  isOpen: boolean
  selectedGoal?: string
  readOnly: boolean
  canRename: boolean

  toggle: () => void
}

interface StateProps {
  conditions: Condition[]
  currentFlow: Flow
}

interface DispatchProps {
  updateFlow: (params: any) => void
  renameFlow: (flow: { targetFlow: string; name: string }) => void
}

type Props = StateProps & DispatchProps & OwnProps

export const sanitizeName = (text: string) =>
  text
    .replace(/\s/g, '-')
    .replace(/[^a-zA-Z0-9\/_-]/g, '')
    .replace(/\/\//, '/')

const EditGoalModal: FC<Props> = props => {
  const [tab, setTab] = useState('overview')

  const [name, setName] = useState<string>('')
  const [label, setLabel] = useState<string>('')
  const [description, setDescription] = useState<string>('')
  const [triggers, setTriggers] = useState<FlowTrigger[]>([])

  useEffect(() => {
    setTab('overview')

    if (props.currentFlow && props.selectedGoal) {
      const { name, label, description, triggers } = props.currentFlow

      setName(name.replace(/\.flow\.json$/i, ''))
      setLabel(label)
      setDescription(description)
      setTriggers(triggers)
    }
  }, [props.isOpen])

  const submit = async () => {
    const fullName = `${name}.flow.json`

    if (props.currentFlow.name !== fullName) {
      props.renameFlow({ targetFlow: props.currentFlow.name, name: fullName })
    }

    props.updateFlow({ name: fullName, description, label })

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
                  <TriggerEditor goalName={name} triggers={triggers} />
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
  currentFlow: getCurrentFlow(state)
})

export default connect<StateProps, DispatchProps, OwnProps>(
  mapStateToProps,
  { updateFlow, renameFlow }
)(EditGoalModal)
