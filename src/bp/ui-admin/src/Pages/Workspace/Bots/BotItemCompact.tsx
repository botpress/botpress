import {
  AnchorButton,
  Button,
  Icon,
  Intent,
  Menu,
  MenuItem,
  Popover,
  PopoverInteractionKind,
  Position,
  Tag,
  Tooltip
} from '@blueprintjs/core'
import { BotConfig } from 'botpress/sdk'
import React, { FC } from 'react'
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
  reloadBot?: () => void
  viewLogs?: () => void
}

const BotItemCompact: FC<Props> = ({
  bot,
  hasError,
  deleteBot,
  exportBot,
  createRevision,
  rollback,
  reloadBot,
  viewLogs
}) => {
  const botShortLink = `${window.location.origin + window['ROOT_PATH']}/s/${bot.id}`
  const botStudioLink = isChatUser() ? botShortLink : `studio/${bot.id}`

  return (
    <div className="bp_table-row" key={bot.id}>
      <div className="actions">
        {hasError && <AnchorButton text="Reload" icon="refresh" onClick={reloadBot} minimal={true} />}

        <AccessControl resource="admin.bots.*" operation="write">
          <Button
            text="Config"
            icon="cog"
            minimal={true}
            className="configBtn"
            onClick={() => history.push(`bots/${bot.id}`)}
          />
        </AccessControl>

        {!bot.disabled && !hasError && (
          <AnchorButton text="Open chat" icon="chat" href={botShortLink} target="_blank" minimal={true} />
        )}

        <AccessControl resource="admin.bots.*" operation="read">
          <Popover minimal position={Position.BOTTOM} interactionKind={PopoverInteractionKind.HOVER}>
            <Button id="btn-menu" icon={<Icon icon="menu" />} minimal={true} />
            <Menu>
              {!bot.disabled && !hasError && (
                <MenuItem disabled={bot.locked} icon="edit" text="Edit in Studio" href={botStudioLink} />
              )}

              <CopyToClipboard text={botShortLink} onCopy={() => toastInfo('Copied to clipboard')}>
                <MenuItem icon="link" text="Copy link to clipboard" />
              </CopyToClipboard>

              <AccessControl resource="admin.logs" operation="read">
                <MenuItem text="View Logs" icon="manual" id="btn-viewLogs" onClick={viewLogs} />
              </AccessControl>

              <AccessControl resource="admin.bots.*" operation="write">
                <MenuItem text="Create Revision" icon="cloud-upload" id="btn-createRevision" onClick={createRevision} />
                <MenuItem text="Rollback" icon="undo" id="btn-rollbackRevision" onClick={rollback} />
                <MenuItem text="Export" icon="export" id="btn-export" onClick={exportBot} />
                <MenuItem text="Delete" icon="trash" id="btn-delete" onClick={deleteBot} />
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
        <a href={botStudioLink}>{bot.name || bot.id}</a>

        {!bot.defaultLanguage && (
          <Tooltip position="right" content="Bot language is missing. Please set it in bot config.">
            <Icon icon="warning-sign" intent={Intent.DANGER} style={{ marginLeft: 10 }} />
          </Tooltip>
        )}

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
      </div>
      <p>{bot.description}</p>
    </div>
  )
}

export default BotItemCompact
