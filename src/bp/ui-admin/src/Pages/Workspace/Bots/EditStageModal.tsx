import { Button, Classes, Dialog, FormGroup, Intent, Radio, RadioGroup } from '@blueprintjs/core'
import React, { FC, useEffect, useState } from 'react'
import { connect } from 'react-redux'
import Select from 'react-select'
import { Input } from 'reactstrap'
import { toastFailure } from '~/utils/toaster'

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
  const [name, setName] = useState('')
  const [action, setAction] = useState('promote_copy')
  const [reviewers, setReviewers] = useState<any>([])
  const [minimumApprovals, setMinimumApprovals] = useState(0)
  const [approvalOrder, setApprovalOrder] = useState('serial')
  const [pipeline, setPipeline] = useState(null)

  useEffect(() => {
    if (props.stage && props.stage.label) {
      setName(props.stage && props.stage.label)
    }
  }, [props.stage])

  useEffect(() => {
    if (props.workspace) {
      const { adminRole, pipeline } = props.workspace

      setPipeline(pipeline)
      props.fetchUsers(adminRole)
    }
  }, [])

  const submit = async () => {
    try {
      setProcessing(true)
      // await api.getSecured({ timeout: 60000 }).post(`/admin/bots/${props.botId}/rollback`, { revision: selected.value })

      props.onEditSuccess()
      closeModal()
    } catch (error) {
      toastFailure(`Error while updating stage: ${error.message}`)
    } finally {
      setProcessing(false)
    }
  }

  const closeModal = () => {
    setProcessing(false)
    props.toggle()
  }

  const formatUser = user => {
    const {
      email,
      attributes: { firstname, lastname }
    } = user

    return {
      label: firstname || lastname ? `${firstname} ${lastname} · ${email}` : email,
      value: email
    }
  }

  const { stage, toggle, users } = props

  console.log(pipeline)

  return (
    <Dialog isOpen={props.isOpen} icon="undo" onClose={closeModal} transitionDuration={0} title={stage && stage.label}>
      <div className={Classes.DIALOG_BODY}>
        <FormGroup label="Label">
          <Input
            id="input-name"
            type="text"
            value={name}
            onChange={({ target: { value } }) => setName(value)}
            autoFocus={true}
          />
        </FormGroup>
        <FormGroup label="Action">
          <RadioGroup onChange={({ currentTarget: { value } }) => setAction(value)} selectedValue={action} inline>
            <Radio label="Copy" value="promote_copy" />
            <Radio label="Move" value="promote_move" />
          </RadioGroup>
        </FormGroup>
        <FormGroup label="Reviewers">
          <Select
            id="select-reviewers"
            isMulti={true}
            value={reviewers}
            options={users && users.map(formatUser)}
            onChange={value => setReviewers(value)}
            autoFocus={true}
          />
        </FormGroup>
        <FormGroup label="Number of approvals required">
          <Input
            id="input-minimumApprovals"
            type="number"
            min={0}
            max={reviewers.length}
            value={minimumApprovals}
            onChange={({ target: { value } }) => setMinimumApprovals(parseInt(value, 10))}
            autoFocus={true}
          />
        </FormGroup>
        <FormGroup label="Approval order">
          <RadioGroup
            onChange={({ currentTarget: { value } }) => setApprovalOrder(value)}
            selectedValue={approvalOrder}
            inline
          >
            <Radio label="Serial" value="serial" />
            <Radio label="Parallel" value="parallel" />
          </RadioGroup>
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
  profile: state.user.profile,
  roles: state.roles.roles,
  users: state.user.users,
  loading: state.user.loadingUsers
})

export default connect<StateProps, DispatchProps, OwnProps>(mapStateToProps, { fetchUsers })(EditStageModal)
