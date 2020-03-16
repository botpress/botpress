import {
  Button,
  Classes,
  Dialog,
  FormGroup,
  InputGroup,
  Intent,
  NumericInput,
  Radio,
  RadioGroup
} from '@blueprintjs/core'
import React, { ChangeEvent, FC, useEffect, useState } from 'react'
import { connect } from 'react-redux'
import Select from 'react-select'
import api from '~/api'
import { toastFailure, toastSuccess } from '~/utils/toaster'
import { getActiveWorkspace } from '~/Auth'

import { WorkspaceUserInfo } from '../../../../../common/typings'
import { fetchUsers } from '../../../reducers/user'

interface StateProps {
  users: WorkspaceUserInfo[]
  loading: boolean
}

interface DispatchProps {
  fetchUsers: (filterRole?: string) => void
}

interface OwnProps {
  workspace: any
  stage: any
  isOpen: boolean
  toggle: () => void
  onEditSuccess: () => void
}

type Props = StateProps & OwnProps & DispatchProps

const EditStageModal: FC<Props> = props => {
  const [isProcessing, setProcessing] = useState(false)
  const [label, setLabel] = useState('')
  const [action, setAction] = useState('promote_copy')
  const [reviewers, setReviewers] = useState<any>([])
  const [minimumApprovals, setMinimumApprovals] = useState(0)
  const [pipeline, setPipeline] = useState<any[]>([])
  const [isLastPipeline, setIsLastPipeline] = useState(false)
  const [formatedUsers, setFormatedUsers] = useState<any>([])

  useEffect(() => {
    if (props.stage) {
      const { id, label, action, reviewers, minimumApprovals } = props.stage
      const formatedReviewers = formatedUsers.filter(
        user => reviewers && reviewers.find(x => user.user.email == x.email && user.user.strategy == x.strategy)
      )

      setIsLastPipeline(pipeline[pipeline.length - 1].id === id)
      setLabel(label || '')
      setAction(isLastPipeline ? 'noop' : action || 'promote_copy')
      setReviewers(formatedReviewers)
      setMinimumApprovals(minimumApprovals || 0)
    }
  }, [props.stage])

  useEffect(() => {
    const { users } = props

    if (users) {
      setFormatedUsers(users.map(formatUser))
    }
  }, [props.users])

  useEffect(() => {
    if (props.workspace) {
      const { adminRole, pipeline } = props.workspace

      setPipeline(pipeline)
      props.fetchUsers(adminRole)
    }
  }, [])

  const submit = async () => {
    const {
      stage: { id }
    } = props
    let newPipeline

    if (!pipeline.find(p => p.id === id)) {
      toastFailure('Could not find the pipeline to save')
    } else {
      newPipeline = pipeline.map(p =>
        p.id !== id
          ? p
          : {
              ...p,
              label,
              action,
              reviewers: reviewers.map(r => r.user),
              minimumApprovals
            }
      )
    }

    try {
      await api
        .getSecured()
        .post(`/admin/workspaces/${getActiveWorkspace()}/pipeline`, { updateCustom: true, pipeline: newPipeline })

      props.onEditSuccess()
      toastSuccess('Stage saved successfully')
      closeModal()
    } catch (error) {
      toastFailure(`Error while updating pipeline: ${error.message}`)
    } finally {
      setProcessing(false)
    }
  }

  const closeModal = () => {
    setProcessing(false)
    props.toggle()
  }

  const formatUser = user => {
    const { email, strategy } = user

    const firstName = user.attributes && user.attributes.firstname
    const lastName = user.attributes && user.attributes.lastname

    return {
      label: firstName || lastName ? `${firstName} ${lastName} · ${email}` : email,
      value: email + strategy,
      user: { email, strategy }
    }
  }

  const onReviewersChange = value => {
    setReviewers(value)

    if (value.length < minimumApprovals) {
      setMinimumApprovals(value.length)
    }
  }

  const onMinimumApprovalsChange = value => {
    value = Number.isNaN(value) ? 0 : value

    setMinimumApprovals(value)
  }

  const { toggle } = props

  return (
    <Dialog isOpen={props.isOpen} onClose={closeModal} transitionDuration={0} title={`Configure Stage: ${label}`}>
      <div className={Classes.DIALOG_BODY}>
        <FormGroup label="Label">
          <InputGroup
            id="input-label"
            type="text"
            value={label}
            onChange={({ target: { value } }: ChangeEvent<HTMLInputElement>) => setLabel(value)}
            autoFocus={true}
          />
        </FormGroup>
        {!isLastPipeline && (
          <FormGroup label="Action">
            <RadioGroup onChange={({ currentTarget: { value } }) => setAction(value)} selectedValue={action} inline>
              <Radio label="Copy" value="promote_copy" />
              <Radio label="Move" value="promote_move" />
            </RadioGroup>
          </FormGroup>
        )}
        <FormGroup label="Reviewers">
          <Select
            id="select-reviewers"
            isMulti={true}
            value={reviewers}
            options={formatedUsers}
            onChange={onReviewersChange}
            autoFocus={true}
          />
        </FormGroup>
        <FormGroup label="Number of approvals required">
          <NumericInput
            id="input-minimumApprovals"
            min={0}
            fill
            clampValueOnBlur
            max={reviewers.length}
            value={minimumApprovals}
            onValueChange={onMinimumApprovalsChange}
            disabled={reviewers.length === 0}
          />
        </FormGroup>
      </div>

      <div className={Classes.DIALOG_FOOTER}>
        <div className={Classes.DIALOG_FOOTER_ACTIONS}>
          <Button id="btn-cancel" text="Cancel" tabIndex={3} onClick={toggle} disabled={isProcessing} />
          <Button
            id="btn-submit"
            text={isProcessing ? 'Please wait...' : 'Save'}
            tabIndex={3}
            onClick={submit}
            disabled={isProcessing}
            intent={Intent.PRIMARY}
          />
        </div>
      </div>
    </Dialog>
  )
}

const mapStateToProps = state => ({
  roles: state.roles.roles,
  users: state.user.users,
  loading: state.user.loadingUsers
})

export default connect<StateProps, DispatchProps, OwnProps>(mapStateToProps, { fetchUsers })(EditStageModal)
