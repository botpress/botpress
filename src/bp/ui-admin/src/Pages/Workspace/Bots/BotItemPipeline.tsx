import {
  Button,
  Icon,
  Intent,
  Menu,
  MenuDivider,
  MenuItem,
  Popover,
  PopoverInteractionKind,
  Position,
  Tag,
  Tooltip
} from '@blueprintjs/core'
import { BotConfig } from 'botpress/sdk'
import React, { FC, Fragment } from 'react'
import { CopyToClipboard } from 'react-copy-to-clipboard'
import history from '~/history'
import { toastInfo } from '~/utils/toaster'

import AccessControl, { isChatUser } from '../../../App/AccessControl'

interface Props {
  bot: BotConfig
  hasError: boolean
  deleteBot?: () => void
  exportBot?: () => void
  createRevision?: () => void
  rollback?: () => void
  requestStageChange?: () => void
  allowStageChange?: boolean
  reloadBot?: () => void
}

const BotItemPipeline: FC<Props> = ({
  bot,
  hasError,
  requestStageChange,
  deleteBot,
  exportBot,
  allowStageChange,
  createRevision,
  rollback,
  reloadBot
}) => {
  const botShortLink = `${window.location.origin + window['ROOT_PATH']}/s/${bot.id}`
  const botStudioLink = isChatUser() ? botShortLink : `studio/${bot.id}`

  return (
    <div className="pipeline_bot" key={bot.id}>
      <div className="actions">
        <AccessControl resource="admin.bots.*" operation="read">
          <Popover minimal position={Position.BOTTOM} interactionKind={PopoverInteractionKind.HOVER}>
            <Button id="btn-menu" icon={<Icon icon="menu" />} minimal={true} />
            <Menu>
              {!bot.disabled && !hasError && (
                <Fragment>
                  <MenuItem icon="chat" text="Open chat" href={botShortLink} />
                  <MenuItem disabled={bot.locked} icon="edit" text="Edit in Studio" href={botStudioLink} />
                </Fragment>
              )}

              <CopyToClipboard text={botShortLink} onCopy={() => toastInfo('Copied to clipboard')}>
                <MenuItem icon="link" text="Copy link to clipboard" />
              </CopyToClipboard>
              <MenuDivider />

              {allowStageChange && (
                <MenuItem
                  text="Promote to next stage"
                  icon="double-chevron-right"
                  id="btn-promote"
                  onClick={requestStageChange}
                />
              )}

              <AccessControl resource="admin.bots.*" operation="write">
                <MenuItem text="Config" icon="cog" id="btn-config" onClick={() => history.push(`bots/${bot.id}`)} />
                <MenuItem text="Create Revision" icon="cloud-upload" id="btn-createRevision" onClick={createRevision} />
                <MenuItem text="Rollback" icon="undo" id="btn-rollbackRevision" onClick={rollback} />
                <MenuItem text="Export" icon="export" id="btn-export" onClick={exportBot} />
                <MenuItem text="Delete" icon="trash" id="btn-delete" onClick={deleteBot} />
                {hasError && <MenuItem text="Reload" icon="refresh" onClick={reloadBot} />}
              </AccessControl>
            </Menu>
          </Popover>
        </AccessControl>
      </div>
      <div className="title">
        {bot.locked && (
          <span>
            <Icon icon="lock" intent={Intent.PRIMARY} iconSize={13} />
            &nbsp;
          </span>
        )}
        {bot.disabled ? <span>{bot.name}</span> : <a href={botStudioLink}>{bot.name}</a>}
        {!bot.defaultLanguage && (
          <Tooltip position="right" content="Bot language is missing. Please set it in bot config.">
            <Icon icon="warning-sign" intent={Intent.DANGER} style={{ marginLeft: 10 }} />
          </Tooltip>
        )}
      </div>
      <p>{bot.description}</p>
      <div>
        {bot.disabled && (
          <Tag intent={Intent.WARNING} className="botbadge">
            disabled
          </Tag>
        )}
        {bot.private && (
          <Tag intent={Intent.PRIMARY} className="botbadge">
            private
          </Tag>
        )}
        {hasError && (
          <Tag intent={Intent.DANGER} className="botbadge">
            error
          </Tag>
        )}
        {bot.pipeline_status.stage_request && (
          <Tooltip
            content={
              <div>
                <p>
                  Requested by: {bot.pipeline_status.stage_request.requested_by} <br />
                  on&nbsp;
                  {new Date(bot.pipeline_status.stage_request.requested_on).toLocaleDateString()}
                </p>
                {bot.pipeline_status.stage_request.message && <p>{bot.pipeline_status.stage_request.message}</p>}
              </div>
            }
          >
            <Tag className="botbadge" id="status-badge">
              {bot.pipeline_status.stage_request.status}
            </Tag>
          </Tooltip>
        )}
      </div>
    </div>
  )
}

export default BotItemPipeline
