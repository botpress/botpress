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
import { BotConfig, ModuleDefinition } from 'botpress/sdk'
import { lang, toast } from 'botpress/shared'
import cx from 'classnames'
import { intersection } from 'lodash'
import React, { FC, Fragment } from 'react'
import { CopyToClipboard } from 'react-copy-to-clipboard'
import history from '~/app/history'
import AccessControl, { isChatUser, isOperationAllowed } from '~/auth/AccessControl'

import { NeedsTrainingWarning } from './NeedsTrainingWarning'
import style from './style.scss'
import { WorkspaceAppItems } from './WorkspaceAppItems'

interface Props {
  bot: BotConfig
  isApprover: boolean
  userEmail: string
  userStrategy: string
  hasError: boolean
  deleteBot?: () => void
  exportBot?: () => void
  createRevision?: () => void
  rollback?: () => void
  requestStageChange?: () => void
  approveStageChange?: () => void
  allowStageChange?: boolean
  reloadBot?: () => void
  viewLogs?: () => void
  loadedModules: ModuleDefinition[]
  installedNLULanguages: string[]
}

const BotItemPipeline: FC<Props> = ({
  bot,
  isApprover,
  userEmail,
  userStrategy,
  hasError,
  requestStageChange,
  approveStageChange,
  deleteBot,
  exportBot,
  allowStageChange,
  createRevision,
  rollback,
  reloadBot,
  viewLogs,
  loadedModules,
  installedNLULanguages
}) => {
  const botShortLink = `${window.location.origin + window['ROOT_PATH']}/s/${bot.id}`
  const botStudioLink = isChatUser() ? botShortLink : `studio/${bot.id}`
  const nluModuleEnabled = !!loadedModules.find(m => m.name === 'nlu')
  const hasStudioAccess = isOperationAllowed({ resource: 'studio', operation: 'read' })
  const requiresApproval =
    isApprover &&
    bot.pipeline_status.stage_request &&
    !(bot.pipeline_status.stage_request.approvals || []).find(x => x.email === userEmail && x.strategy === userStrategy)
  const languages = intersection(bot.languages, installedNLULanguages)
  const botHasUninstalledNLULanguages = bot.languages.length !== languages.length ? true : false

  return (
    <div className={style.pipeline_bot} key={bot.id}>
      <div className={style.actions}>
        <AccessControl resource="admin.bots.*" operation="read">
          <Popover minimal position={Position.BOTTOM} interactionKind={PopoverInteractionKind.HOVER}>
            <Button id="btn-menu-pipeline" icon={<Icon icon="menu" />} minimal />
            <Menu>
              <WorkspaceAppItems loadedModules={loadedModules} botId={bot.id} />

              {!bot.disabled && !hasError && (
                <Fragment>
                  <MenuItem icon="chat" text={lang.tr('admin.workspace.bots.item.openChat')} href={botShortLink} />
                  {hasStudioAccess && (
                    <MenuItem
                      disabled={bot.locked}
                      icon="edit"
                      text={lang.tr('admin.workspace.bots.item.editInStudio')}
                      href={botStudioLink}
                    />
                  )}
                </Fragment>
              )}

              <CopyToClipboard
                text={botShortLink}
                onCopy={() => toast.info(lang.tr('admin.workspace.bots.item.copyToClipboard'))}
              >
                <MenuItem icon="link" text={lang.tr('admin.workspace.bots.item.copyLinkToClipboard')} />
              </CopyToClipboard>
              <MenuDivider />

              <AccessControl resource="admin.logs" operation="read">
                <MenuItem
                  text={lang.tr('admin.workspace.bots.item.viewLogs')}
                  icon="manual"
                  id="btn-viewLogs"
                  onClick={viewLogs}
                />
              </AccessControl>

              {allowStageChange && (
                <MenuItem
                  text={lang.tr('admin.workspace.bots.item.promoteToNextStage')}
                  icon="double-chevron-right"
                  id="btn-promote"
                  onClick={requestStageChange}
                />
              )}

              <AccessControl resource="admin.bots.*" operation="write">
                <MenuItem
                  text={lang.tr('admin.workspace.bots.item.config')}
                  icon="cog"
                  id="btn-config"
                  href={`${botStudioLink}/config`}
                  onClick={() => history.push(`bots/${bot.id}`)}
                />
                <MenuItem
                  text={lang.tr('admin.workspace.bots.item.createRevision')}
                  icon="cloud-upload"
                  id="btn-createRevision-pipeline"
                  onClick={createRevision}
                />
                <MenuItem
                  text={lang.tr('admin.workspace.bots.item.rollback')}
                  icon="undo"
                  id="btn-rollbackRevision-pipepline"
                  onClick={rollback}
                />
              </AccessControl>
              <AccessControl resource="admin.bots.archive" operation="read">
                <MenuItem
                  text={lang.tr('admin.workspace.bots.item.export')}
                  icon="export"
                  id="btn-export-pipeline"
                  onClick={exportBot}
                />
              </AccessControl>
              <AccessControl resource="admin.bots.*" operation="write">
                <MenuItem
                  text={lang.tr('admin.workspace.bots.item.delete')}
                  icon="trash"
                  id="btn-delete-pipeline"
                  onClick={deleteBot}
                />
                {hasError && (
                  <MenuItem text={lang.tr('admin.workspace.bots.item.reload')} icon="refresh" onClick={reloadBot} />
                )}
              </AccessControl>
            </Menu>
          </Popover>
        </AccessControl>
      </div>
      <div className={style.title}>
        {bot.locked && (
          <span>
            <Icon icon="lock" intent={Intent.PRIMARY} iconSize={13} />
            &nbsp;
          </span>
        )}
        {bot.disabled || !hasStudioAccess ? (
          <span className={style.bot_name}>{bot.name}</span>
        ) : (
          <a className={style.bot_name} href={botStudioLink}>
            {bot.name}
          </a>
        )}
        {requiresApproval && (
          <Tag intent={Intent.DANGER} className={cx(style.botbadge, style.reviewNeeded)}>
            {lang.tr('admin.workspace.bots.item.needsYourReview')}
          </Tag>
        )}
        {bot.pipeline_status.stage_request && isApprover && !requiresApproval && (
          <Tag intent={Intent.SUCCESS} className={cx(style.botbadge, style.reviewNeeded)}>
            {lang.tr('admin.workspace.bots.item.approved')}
          </Tag>
        )}

        <AccessControl resource="module.nlu" operation="write">
          {nluModuleEnabled && <NeedsTrainingWarning bot={bot.id} languages={bot.languages} />}
        </AccessControl>

        {botHasUninstalledNLULanguages && (
          <Tooltip position="right" content={lang.tr('admin.workspace.bots.item.enableNLULanguages')}>
            <Icon icon="translate" intent={Intent.DANGER} style={{ marginLeft: 10 }} />
          </Tooltip>
        )}
      </div>
      <p>{bot.description}</p>
      <div className={style.bottomRow}>
        {bot.disabled && (
          <Tag intent={Intent.WARNING} className={style.botbadge}>
            {lang.tr('admin.workspace.bots.item.disabled')}
          </Tag>
        )}
        {bot.private && (
          <Tag intent={Intent.PRIMARY} className={style.botbadge}>
            {lang.tr('admin.workspace.bots.item.private')}
          </Tag>
        )}
        {hasError && (
          <Tag intent={Intent.DANGER} className={style.botbadge}>
            {lang.tr('admin.workspace.bots.item.error')}
          </Tag>
        )}
        {bot.pipeline_status.stage_request && (
          <Tooltip
            content={
              <div>
                <p>
                  {lang.tr('admin.workspace.bots.item.requestedBy', {
                    requester: bot.pipeline_status.stage_request.requested_by
                  })}
                  <br />
                  {lang.tr('admin.workspace.bots.item.onDate', {
                    date: new Date(bot.pipeline_status.stage_request.requested_on).toLocaleDateString()
                  })}
                </p>
                {bot.pipeline_status.stage_request.message && <p>{bot.pipeline_status.stage_request.message}</p>}
              </div>
            }
          >
            <Tag className={style.botbadge} id="status-badge">
              {bot.pipeline_status.stage_request.status}
            </Tag>
          </Tooltip>
        )}
        {requiresApproval && (
          <div className={style.stage_approval_btns}>
            <Button onClick={approveStageChange} small intent="success">
              {lang.tr('admin.workspace.bots.item.approve')}
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}

export default BotItemPipeline
