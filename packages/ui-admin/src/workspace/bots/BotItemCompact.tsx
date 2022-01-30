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
import { BotConfig, ModuleDefinition } from 'botpress/sdk'
import { lang } from 'botpress/shared'
import cx from 'classnames'
import { intersection } from 'lodash'
import React, { FC } from 'react'
import { CopyToClipboard } from 'react-copy-to-clipboard'

import AccessControl, { isChatUser, isOperationAllowed } from '~/auth/AccessControl'
import { NeedsTrainingWarning } from './NeedsTrainingWarning'
import style from './style.scss'
import { WorkspaceAppItems } from './WorkspaceAppItems'

interface Props {
  bot: BotConfig
  hasError: boolean
  installedNLULanguages: string[]
  loadedModules: ModuleDefinition[]
  deleteBot?: () => void
  exportBot?: () => void
  createRevision?: () => void
  rollback?: () => void
  reloadBot?: () => void
  viewLogs?: () => void
}

const BotItemCompact: FC<Props> = props => {
  const botShortLink = `${window.location.origin + window['ROOT_PATH']}/s/${props.bot.id}`
  const botStudioLink = isChatUser() ? botShortLink : `studio/${props.bot.id}`
  const nluModuleEnabled = !!props.loadedModules.find(m => m.name === 'nlu')
  const hasStudioAccess = isOperationAllowed({ resource: 'studio', operation: 'read' })
  const languages = intersection(props.bot.languages, props.installedNLULanguages)
  const botHasUninstalledNLULanguages = props.bot.languages.length !== languages.length ? true : false

  return (
    <div className={cx('bp_table-row', style.tableRow)} key={props.bot.id}>
      <div className={cx('actions', style.actions)}>
        {props.hasError && (
          <AnchorButton
            text={lang.tr('admin.workspace.bots.item.reload')}
            icon="refresh"
            onClick={props.reloadBot}
            minimal
          />
        )}

        <AccessControl resource="admin.bots.*" operation="write">
          <Button
            text={lang.tr('admin.workspace.bots.item.config')}
            icon="cog"
            minimal
            onClick={() => (location.href = `${botStudioLink}/config`)}
          />
        </AccessControl>

        {!props.bot.disabled && !props.hasError && (
          <AnchorButton
            text={lang.tr('admin.workspace.bots.item.openChat')}
            icon="chat"
            href={botShortLink}
            target="_blank"
            minimal
          />
        )}

        <AccessControl resource="admin.bots.*" operation="read">
          <Popover minimal position={Position.BOTTOM} interactionKind={PopoverInteractionKind.HOVER}>
            <Button className="btn-menu-bot-item" icon={<Icon icon="menu" />} minimal />

            <Menu>
              <WorkspaceAppItems loadedModules={props.loadedModules} botId={props.bot.id} />

              {!props.bot.disabled && !props.hasError && hasStudioAccess && (
                <MenuItem
                  disabled={props.bot.locked}
                  icon="edit"
                  text={lang.tr('admin.workspace.bots.item.editInStudio')}
                  href={botStudioLink}
                />
              )}

              <CopyToClipboard text={botShortLink} onCopy={() => lang.tr('admin.workspace.bots.item.copyToClipboard')}>
                <MenuItem icon="link" text={lang.tr('admin.workspace.bots.item.copyLinkToClipboard')} />
              </CopyToClipboard>

              <AccessControl resource="admin.logs" operation="read">
                <MenuItem
                  text={lang.tr('admin.workspace.bots.item.viewLogs')}
                  icon="manual"
                  id="btn-viewLogs"
                  onClick={props.viewLogs}
                />
              </AccessControl>

              <AccessControl resource="admin.bots.*" operation="write">
                <MenuItem
                  text={lang.tr('admin.workspace.bots.item.createRevision')}
                  icon="cloud-upload"
                  id="btn-createRevision-bot-item"
                  onClick={props.createRevision}
                />
                <MenuItem
                  text={lang.tr('admin.workspace.bots.item.rollback')}
                  icon="undo"
                  id="btn-rollbackRevision-bot-item"
                  onClick={props.rollback}
                />
              </AccessControl>
              <AccessControl resource="admin.bots.archive" operation="read">
                <MenuItem
                  text={lang.tr('admin.workspace.bots.item.export')}
                  icon="export"
                  id="btn-export-bot-item"
                  onClick={props.exportBot}
                />
              </AccessControl>
              <AccessControl resource="admin.bots.*" operation="write">
                <MenuItem
                  text={lang.tr('admin.workspace.bots.item.delete')}
                  icon="trash"
                  id="btn-delete-bot-item"
                  onClick={props.deleteBot}
                />
              </AccessControl>
            </Menu>
          </Popover>
        </AccessControl>
      </div>

      <div className={style.title}>
        {props.bot.locked && (
          <span>
            <Icon icon="lock" intent={Intent.PRIMARY} iconSize={13} />
            &nbsp;
          </span>
        )}

        {hasStudioAccess ? (
          <a href={botStudioLink}>{props.bot.name || props.bot.id}</a>
        ) : (
          <span>{props.bot.name || props.bot.id}</span>
        )}

        {/*
          TODO: remove this NeedsTrainingWarning component.
          This is a temp fix but won't be useful after we bring back training on bot mount.
          */}
        <AccessControl resource="module.nlu" operation="write">
          {nluModuleEnabled && !props.bot.disabled && (
            <NeedsTrainingWarning bot={props.bot.id} languages={props.bot.languages} />
          )}
        </AccessControl>

        {botHasUninstalledNLULanguages && (
          <Tooltip
            position="right"
            content={lang.tr('admin.workspace.bots.item.enableNLULanguages', {
              languages: languages.join(',')
            })}
          >
            <Icon icon="translate" intent={Intent.DANGER} style={{ marginLeft: 10 }} />
          </Tooltip>
        )}

        {props.bot.disabled && (
          <Tag intent={Intent.WARNING} className={style.botbadge}>
            disabled
          </Tag>
        )}
        {props.bot.private && (
          <Tag intent={Intent.PRIMARY} className={style.botbadge}>
            private
          </Tag>
        )}
        {props.hasError && (
          <Tag intent={Intent.DANGER} className={style.botbadge}>
            error
          </Tag>
        )}
      </div>
      <p>{props.bot.description}</p>
    </div>
  )
}
export default BotItemCompact
