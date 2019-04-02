import React, { Fragment } from 'react'
import { Badge, UncontrolledButtonDropdown, DropdownToggle, DropdownItem, DropdownMenu } from 'reactstrap'
import { AccessControl } from '../../../App/AccessControl'
import { Link } from 'react-router-dom'

export default ({ bot, requestStageChange, deleteBot, exportBot, permissions, allowPromotion }) => (
  <div className="bp_table-row" key={bot.id}>
    <div className="actions">
      <UncontrolledButtonDropdown>
        <DropdownToggle caret size="sm" outline color="primary">
          Actions
        </DropdownToggle>
        <DropdownMenu>
          <DropdownItem tag="a" target="_blank" href={`${window.location.origin}/s/${bot.id}`}>
            Open chat
          </DropdownItem>
          <DropdownItem tag="a" href={`/studio/${bot.id}`}>
            Edit
          </DropdownItem>
          <AccessControl permissions={permissions} resource="admin.bots.*" operation="write">
            <DropdownItem onClick={exportBot}>Export</DropdownItem>
            {allowPromotion && <DropdownItem onClick={requestStageChange}>Promote to next stage</DropdownItem>}
            <DropdownItem onClick={deleteBot}>Delete</DropdownItem>
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
