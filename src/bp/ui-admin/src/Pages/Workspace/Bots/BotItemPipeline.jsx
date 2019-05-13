import React from 'react'
import {
  Badge,
  UncontrolledButtonDropdown,
  DropdownToggle,
  DropdownItem,
  DropdownMenu,
  UncontrolledTooltip
} from 'reactstrap'
import { AccessControl } from '../../../App/AccessControl'
import { IoIosChatbubble } from 'react-icons/lib/io'
import {
  MdModeEdit,
  MdArchive,
  MdDelete,
  MdSkipNext,
  MdLock,
  MdMoreVert,
  MdWarning,
  MdBackup,
  MdReplay
} from 'react-icons/lib/md'
import { FaCog } from 'react-icons/lib/fa'

export default ({
  bot,
  requestStageChange,
  deleteBot,
  exportBot,
  permissions,
  allowStageChange,
  history,
  createRevision,
  rollback
}) => (
  <div className="pipeline_bot" key={bot.id}>
    <div className="actions">
      <UncontrolledButtonDropdown>
        <DropdownToggle tag="span" className="more">
          <MdMoreVert />
        </DropdownToggle>
        <DropdownMenu>
          <DropdownItem tag="a" target="_blank" href={`${window.location.origin}/s/${bot.id}`}>
            <IoIosChatbubble /> &nbsp;Open chat
          </DropdownItem>
          <DropdownItem disabled={bot.locked} tag="a" href={`/studio/${bot.id}`}>
            <MdModeEdit />
            &nbsp;Edit in studio
          </DropdownItem>
          {allowStageChange && (
            <DropdownItem onClick={requestStageChange}>
              <MdSkipNext />
              &nbsp;Promote to next stage
            </DropdownItem>
          )}
          <AccessControl permissions={permissions} resource="admin.bots.*" operation="write">
            <DropdownItem disabled={bot.locked} onClick={() => history.push(`/bot/${bot.id}/details`)}>
              <FaCog />
              &nbsp;Configs
            </DropdownItem>
            <DropdownItem onClick={createRevision}>
              <MdBackup />
              &nbsp;Create revision
            </DropdownItem>
            <DropdownItem onClick={rollback}>
              <MdReplay />
              &nbsp;Rollback
            </DropdownItem>
            <DropdownItem onClick={exportBot}>
              <MdArchive />
              &nbsp;Export
            </DropdownItem>
            <DropdownItem onClick={deleteBot}>
              <MdDelete />
              &nbsp;Delete
            </DropdownItem>
          </AccessControl>
        </DropdownMenu>
      </UncontrolledButtonDropdown>
    </div>
    <div className="title">
      {bot.locked && (
        <span>
          <MdLock className="text-primary" />
          &nbsp;
        </span>
      )}
      {bot.disabled ? <span>{bot.name}</span> : <a href={`/studio/${bot.id}`}>{bot.name}</a>}
      {!bot.defaultLanguage && (
        <React.Fragment>
          <MdWarning id={`${bot.id}-warn`} className="text-danger" />
          <UncontrolledTooltip placement="right" target={`${bot.id}-warn`}>
            Bot language is missing. Please set it in bot config.
          </UncontrolledTooltip>
        </React.Fragment>
      )}
    </div>
    <p>{bot.description}</p>
    <div>
      {bot.disabled && (
        <Badge color="warning" className="botbadge">
          disabled
        </Badge>
      )}
      {bot.private && (
        <Badge color="primary" className="botbadge">
          private
        </Badge>
      )}
      {bot.pipeline_status.stage_request && (
        <React.Fragment>
          <Badge color="secondary" className="botbadge" id="status-badge">
            {bot.pipeline_status.stage_request.status}
          </Badge>
          <UncontrolledTooltip placement="bottom" target="status-badge">
            <p>
              Requested by: {bot.pipeline_status.stage_request.requested_by} <br />
              on&nbsp;
              {new Date(bot.pipeline_status.stage_request.requested_on).toLocaleDateString()}
            </p>
            {bot.pipeline_status.stage_request.message && <p>{bot.pipeline_status.stage_request.message}</p>}
          </UncontrolledTooltip>
        </React.Fragment>
      )}
    </div>
  </div>
)
