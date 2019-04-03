import React, { Fragment } from 'react'
import { Badge, UncontrolledButtonDropdown, DropdownToggle, DropdownItem, DropdownMenu } from 'reactstrap'
import { AccessControl } from '../../../App/AccessControl'
import { Link } from 'react-router-dom'
import { IoIosChatbubble } from 'react-icons/lib/io'
import { MdModeEdit, MdArchive, MdDelete, MdSkipNext } from 'react-icons/lib/md'
import { FaCog } from 'react-icons/lib/fa'

export default ({ bot, requestStageChange, deleteBot, exportBot, permissions, allowStageChange }) => (
  <div className="pipeline_bot" key={bot.id}>
    <div className="actions">
      <UncontrolledButtonDropdown>
        <DropdownToggle caret size="sm" outline color="primary">
          Actions
        </DropdownToggle>
        <DropdownMenu>
          <DropdownItem tag="a" target="_blank" href={`${window.location.origin}/s/${bot.id}`}>
            <IoIosChatbubble /> &nbsp;Open chat
          </DropdownItem>
          <DropdownItem tag={Link} to={`/studio/${bot.id}`}>
            <MdModeEdit />
            &nbsp;Edit in studio
          </DropdownItem>
          <DropdownItem tag="a" href={`/admin/bot/${bot.id}/details`}>
            <FaCog />
            &nbsp;Configs
          </DropdownItem>
          <AccessControl permissions={permissions} resource="admin.bots.*" operation="write">
            <DropdownItem onClick={exportBot}>
              <MdArchive />
              &nbsp;Export
            </DropdownItem>
            {allowStageChange && (
              <DropdownItem onClick={requestStageChange}>
                <MdSkipNext />
                &nbsp;Promote to next stage
              </DropdownItem>
            )}
            <DropdownItem onClick={deleteBot}>
              <MdDelete />
              &nbsp;Delete
            </DropdownItem>
          </AccessControl>
        </DropdownMenu>
      </UncontrolledButtonDropdown>
    </div>
    <div className="title">
      {bot.disabled ? (
        <Fragment>
          <span>{bot.name}</span>
          <Badge color="danger" style={{ marginLeft: 10, fontSize: '60%' }}>
            disabled
          </Badge>
        </Fragment>
      ) : (
        <Fragment>
          <Link to={`/studio/${bot.id}`}>{bot.name}</Link>
          {bot.private && (
            <Badge color="primary" style={{ marginLeft: 10, fontSize: '60%' }}>
              private
            </Badge>
          )}
        </Fragment>
      )}
    </div>
    <p>{bot.description}</p>
  </div>
)
