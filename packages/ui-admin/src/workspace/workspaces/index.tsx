import { Button, Icon, Menu, MenuDivider, MenuItem, Popover, PopoverInteractionKind, Position } from '@blueprintjs/core'
import { Workspace } from 'common/typings'
import React, { FC, useEffect, useState } from 'react'
import { connect, ConnectedProps } from 'react-redux'

import PageContainer from '~/app/common/PageContainer'
import SplitPage from '~/app/common/SplitPage'
import history from '~/app/history'
import { AppState } from '~/app/rootReducer'
import { fetchMyWorkspaces } from '~/user/reducer'

import ChangePipelineModal from './ChangePipelineModal'
import CreateWorkspaceModal from './CreateWorkspaceModal'
import DeleteWorkspaceModal from './DeleteWorkspaceModal'
import EditWorkspaceModal from './EditWorkspaceModal'
import { fetchWorkspaces } from './reducer'
import RolloutStrategyModal from './RolloutStrategyModal'
import style from './style.scss'

type Props = ConnectedProps<typeof connector>

const Workspaces: FC<Props> = props => {
  const [workspace, setWorkspace] = useState<Workspace>()
  const [pipelineModalOpen, setPipelineModalOpen] = useState(false)
  const [editModalOpen, setEditModalOpen] = useState(false)
  const [rolloutModalOpen, setRolloutModalOpen] = useState(false)
  const [deleteModalOpen, setDeleteModalOpen] = useState(false)

  useEffect(() => {
    props.fetchWorkspaces()
  }, [])

  const editWorkspace = (workspace: Workspace) => {
    setWorkspace(workspace)
    setEditModalOpen(true)
  }

  const editRollout = (workspace: Workspace) => {
    setWorkspace(workspace)
    setRolloutModalOpen(true)
  }

  const editPipeline = (workspace: Workspace) => {
    setWorkspace(workspace)
    setPipelineModalOpen(true)
  }

  const deleteWorkspace = (workspace: Workspace) => {
    setWorkspace(workspace)
    setDeleteModalOpen(true)
  }

  const openWorkspace = wId => history.push(`/workspace/${wId}/bots`)

  const refreshWorkspaces = () => {
    props.fetchMyWorkspaces()
    props.fetchWorkspaces()
  }

  if (!props.workspaces) {
    return null
  }

  return (
    <PageContainer title="Manage Workspaces">
      <SplitPage sideMenu={<CreateWorkspaceModal refreshWorkspaces={refreshWorkspaces} />}>
        <div className={style.table}>
          {props.workspaces.map(workspace => (
            <div className={style.tableRow} key={workspace.id}>
              <div className={style.actions}>
                <Popover minimal position={Position.BOTTOM} interactionKind={PopoverInteractionKind.HOVER}>
                  <Button id="btn-menu-workspaces" icon={<Icon icon="menu" />} minimal={true} />
                  <Menu>
                    <MenuItem
                      id="btn-edit"
                      icon="edit"
                      text="Edit Workspace"
                      onClick={() => editWorkspace(workspace)}
                    />
                    <MenuItem
                      id="btn-rollout-configure"
                      icon="send-to-graph"
                      text="Configure Rollout"
                      onClick={() => editRollout(workspace)}
                    />
                    <MenuItem
                      id="btn-pipeline"
                      icon="git-branch"
                      text="Configure Pipeline"
                      onClick={() => editPipeline(workspace)}
                    />
                    <MenuDivider />
                    <MenuItem
                      id="btn-delete-workspace"
                      icon="trash"
                      text="Delete Workspace"
                      onClick={() => deleteWorkspace(workspace)}
                    />
                  </Menu>
                </Popover>
              </div>
              <div className={style.spaced}>
                <div>
                  <a className={style.link} onClick={() => openWorkspace(workspace.id)}>
                    <strong>{workspace.name}</strong>
                  </a>{' '}
                  <span>({workspace.id})</span>
                </div>
                <div style={{ width: 200 }}>
                  <small>
                    {workspace.bots.length} bot{workspace.bots.length === 1 ? '' : 's'} - {workspace.audience} users
                  </small>
                </div>
              </div>
              <p>{workspace.description}</p>
            </div>
          ))}
        </div>
      </SplitPage>

      <EditWorkspaceModal
        workspace={workspace!}
        isOpen={editModalOpen}
        toggle={() => setEditModalOpen(!editModalOpen)}
        refreshWorkspaces={refreshWorkspaces}
      />

      <ChangePipelineModal
        workspace={workspace!}
        isOpen={pipelineModalOpen}
        toggle={() => setPipelineModalOpen(!pipelineModalOpen)}
        refreshWorkspaces={refreshWorkspaces}
      />

      <DeleteWorkspaceModal
        workspace={workspace!}
        isOpen={deleteModalOpen}
        toggle={() => setDeleteModalOpen(!deleteModalOpen)}
        refreshWorkspaces={refreshWorkspaces}
      />

      <RolloutStrategyModal
        workspaceId={workspace && workspace.id}
        isOpen={rolloutModalOpen}
        toggle={() => setRolloutModalOpen(!rolloutModalOpen)}
        refreshWorkspaces={refreshWorkspaces}
      />
    </PageContainer>
  )
}

const mapStateToProps = (state: AppState) => ({ workspaces: state.workspaces.list })
const connector = connect(mapStateToProps, { fetchWorkspaces, fetchMyWorkspaces })

export default connector(Workspaces)
