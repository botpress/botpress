import {
  Alignment,
  Button,
  ButtonGroup,
  Callout,
  Checkbox,
  Icon,
  InputGroup,
  Intent,
  Popover,
  PopoverInteractionKind,
  Position
} from '@blueprintjs/core'
import { BotConfig } from 'botpress/sdk'
import { confirmDialog, lang, telemetry, toast } from 'botpress/shared'
import cx from 'classnames'
import _ from 'lodash'
import React, { Component, Fragment } from 'react'
import { connect, ConnectedProps } from 'react-redux'
import { generatePath, RouteComponentProps } from 'react-router'

import api from '~/app/api'
import { Downloader } from '~/app/common/Downloader'
import LoadingSection from '~/app/common/LoadingSection'
import PageContainer from '~/app/common/PageContainer'
import SplitPage from '~/app/common/SplitPage'
import { AppState } from '~/app/rootReducer'
import AccessControl from '~/auth/AccessControl'
import { getActiveWorkspace } from '~/auth/basicAuth'
import { fetchLicensing } from '~/management/licensing/reducer'
import { fetchModules } from '~/management/modules/reducer'
import { fetchBotHealth, fetchBots, fetchBotNLULanguages } from '~/workspace/bots/reducer'
import { filterList } from '~/workspace/util'

import BotItemCompact from './BotItemCompact'
import BotItemPipeline from './BotItemPipeline'
import CreateBotModal from './CreateBotModal'
import EditStageModal from './EditStageModal'
import ImportBotModal from './ImportBotModal'
import RollbackBotModal from './RollbackBotModal'
import style from './style.scss'

const botFilterFields = ['name', 'id', 'description']

type Props = ConnectedProps<typeof connector> & RouteComponentProps

class Bots extends Component<Props> {
  state = {
    isCreateBotModalOpen: false,
    isRollbackModalOpen: false,
    isImportBotModalOpen: false,
    isEditStageModalOpen: false,
    focusedBot: null,
    selectedStage: null,
    archiveUrl: undefined,
    archiveName: '',
    filter: '',
    showFilters: false,
    needApprovalFilter: false
  }

  componentDidMount() {
    this.props.fetchBots()
    this.props.fetchBotHealth()
    this.props.fetchBotNLULanguages()

    if (!this.props.loadedModules.length && this.props.profile && this.props.profile.isSuperAdmin) {
      this.props.fetchModules()
    }

    if (!this.props.licensing) {
      this.props.fetchLicensing()
    }

    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    telemetry.startFallback(api.getSecured({ useV1: true })).catch()
  }

  toggleCreateBotModal = () => {
    this.setState({ isCreateBotModalOpen: !this.state.isCreateBotModalOpen })
  }

  toggleImportBotModal = () => {
    this.setState({ isImportBotModalOpen: !this.state.isImportBotModalOpen })
  }

  async exportBot(botId: string) {
    this.setState({
      archiveUrl: `/admin/workspace/bots/${botId}/export`,
      archiveName: `bot_${botId}_${Date.now()}.tgz`
    })
  }

  async deleteBot(botId: string) {
    if (
      await confirmDialog(lang.tr('admin.workspace.bots.confirmDelete'), {
        acceptLabel: lang.tr('delete')
      })
    ) {
      await api.getSecured().post(`/admin/workspace/bots/${botId}/delete`)
      this.props.fetchBots()
    }
  }

  async reloadBot(botId: string) {
    try {
      await api.getSecured().post(`/admin/workspace/bots/${botId}/reload`)
      this.props.fetchBots()
      this.props.fetchBotHealth()
      toast.success(lang.tr('admin.workspace.bots.remounted'))
    } catch (err) {
      console.error(err)
      toast.failure(lang.tr('admin.workspace.bots.couldNotMount'))
    }
  }

  viewLogs(botId: string) {
    this.props.history.push(
      generatePath('/workspace/:workspaceId?/logs?botId=:botId', {
        workspaceId: getActiveWorkspace() || undefined,
        botId
      })
    )
  }

  renderCreateNewBotButton() {
    return (
      <AccessControl resource="admin.bots.*" operation="write">
        <Popover minimal interactionKind={PopoverInteractionKind.HOVER} position={Position.BOTTOM}>
          <Button
            id="btn-create-bot"
            intent={Intent.NONE}
            text={lang.tr('admin.workspace.bots.createBot')}
            rightIcon="caret-down"
          />
          <ButtonGroup vertical={true} minimal={true} fill={true} alignText={Alignment.LEFT}>
            <Button
              id="btn-new-bot"
              text={lang.tr('admin.workspace.bots.new')}
              icon="add"
              onClick={() => this.setState({ isCreateBotModalOpen: true })}
            />
            <Button
              id="btn-import-bot"
              text={lang.tr('admin.workspace.bots.importExisting')}
              icon="import"
              onClick={() => this.setState({ isImportBotModalOpen: true })}
            />
          </ButtonGroup>
        </Popover>
      </AccessControl>
    )
  }

  hasUnlangedBots = () => {
    return this.props.bots.reduce((hasUnlangedBots, bot) => hasUnlangedBots || !bot.defaultLanguage, false)
  }

  async requestStageChange(botId: string) {
    await api.getSecured({ timeout: 60000 }).post(`/admin/workspace/bots/${botId}/stage`)
    this.props.fetchBots()
    toast.success(lang.tr('admin.workspace.bots.promoted'))
  }

  async approveStageChange(botId) {
    await api.getSecured({ timeout: 60000 }).post(`/admin/workspace/bots/${botId}/approve-stage`)
    this.props.fetchBots()
    toast.success(lang.tr('admin.workspace.bots.approvedPromotion'))
  }

  isLicensed = () => {
    return _.get(this.props.licensing, 'status') === 'licensed'
  }

  async createRevision(botId) {
    await api.getSecured().post(`admin/workspace/bots/${botId}/revisions`)
    toast.success(lang.tr('admin.workspace.bots.revisionsCreated'))
  }

  toggleRollbackModal = (botId?: string) => {
    this.setState({
      focusedBot: typeof botId === 'string' ? botId : null,
      isRollbackModalOpen: !this.state.isRollbackModalOpen
    })
  }

  handleRollbackSuccess = () => {
    this.props.fetchBots()
    toast.success(lang.tr('admin.workspace.bots.rollbackSuccess'))
  }

  handleEditStageSuccess = () => {
    this.props.fetchBots()
  }

  toggleEditStage = (stage?) => {
    this.setState({
      selectedStage: stage ? stage : null,
      isEditStageModalOpen: !this.state.isEditStageModalOpen
    })
  }

  toggleFilters = () => {
    this.setState({ showFilters: !this.state.showFilters })
  }

  findBotError(botId: string) {
    if (!this.props.health) {
      return false
    }

    return _.some(
      this.props.health.map(x => x.bots[botId]),
      s => s && s.status === 'unhealthy'
    )
  }

  renderCompactView(bots: BotConfig[]) {
    if (!bots.length) {
      return null
    }

    return (
      <div className={cx(style.bot_views, style.compact_view, style.table)}>
        {bots.map(bot => (
          <Fragment key={bot.id}>
            <BotItemCompact
              bot={bot}
              loadedModules={this.props.loadedModules}
              hasError={this.findBotError(bot.id)}
              deleteBot={this.deleteBot.bind(this, bot.id)}
              exportBot={this.exportBot.bind(this, bot.id)}
              createRevision={this.createRevision.bind(this, bot.id)}
              rollback={this.toggleRollbackModal.bind(this, bot.id)}
              reloadBot={this.reloadBot.bind(this, bot.id)}
              viewLogs={this.viewLogs.bind(this, bot.id)}
              installedNLULanguages={this.props.language}
            />
          </Fragment>
        ))}
      </div>
    )
  }

  renderPipelineView(bots: BotConfig[]) {
    const { pipeline } = this.props.workspace || {}
    const { email, strategy } = this.props.profile || {}

    const botsByStage = _.groupBy(bots, 'pipeline_status.current_stage.id')
    const colSize = Math.floor(12 / pipeline.length)

    return (
      <Fragment>
        <div className={cx(style.row, style.pipeline_view, style.bot_views)}>
          {pipeline.map((stage, idx) => {
            const allowStageChange = this.isLicensed() && idx !== pipeline.length - 1
            return (
              <div key={stage.id} style={{ flex: colSize, marginRight: 20 }}>
                {pipeline.length > 1 && (
                  <div className={style.pipeline_title}>
                    <h3>{stage.label}</h3>
                    <AccessControl resource="admin.bots.*" operation="write" superAdmin>
                      <Button className={style.pipeline_edit_button} onClick={() => this.toggleEditStage(stage)}>
                        <Icon icon="edit" />
                      </Button>
                    </AccessControl>
                  </div>
                )}
                {idx === 0 && (
                  <div className={cx(style.pipeline_bot, style.create)}>{this.renderCreateNewBotButton()}</div>
                )}
                {(botsByStage[stage.id] || []).map(bot => (
                  <Fragment key={bot.id}>
                    <BotItemPipeline
                      loadedModules={this.props.loadedModules}
                      bot={bot}
                      isApprover={stage.reviewers.find(r => r.email === email && r.strategy === strategy) !== undefined}
                      userEmail={email!}
                      userStrategy={strategy!}
                      hasError={this.findBotError(bot.id)}
                      allowStageChange={allowStageChange && !bot.disabled}
                      requestStageChange={this.requestStageChange.bind(this, bot.id)}
                      approveStageChange={this.approveStageChange.bind(this, bot.id)}
                      deleteBot={this.deleteBot.bind(this, bot.id)}
                      exportBot={this.exportBot.bind(this, bot.id)}
                      createRevision={this.createRevision.bind(this, bot.id)}
                      rollback={this.toggleRollbackModal.bind(this, bot.id)}
                      reloadBot={this.reloadBot.bind(this, bot.id)}
                      viewLogs={this.viewLogs.bind(this, bot.id)}
                      installedNLULanguages={this.props.language}
                    />
                  </Fragment>
                ))}
              </div>
            )
          })}
        </div>
      </Fragment>
    )
  }

  filterStageApproval(bot: BotConfig, email: string, strategy: string) {
    if (!this.props.workspace || !this.state.needApprovalFilter) {
      return true
    }
    const { pipeline } = this.props.workspace
    const { current_stage, stage_request } = bot.pipeline_status

    const reviewers = _.get(current_stage && pipeline.find(x => x.id === current_stage.id), 'reviewers', [])
    const isReviewer = reviewers.find(x => x.strategy === strategy && x.email === email)

    return stage_request && isReviewer
  }

  renderBots() {
    const { email, strategy } = this.props.profile || {}

    const filteredBots = filterList<BotConfig>(this.props.bots, botFilterFields, this.state.filter).filter(x =>
      this.filterStageApproval(x, email!, strategy!)
    )

    const hasBots = !!this.props.bots.length
    const botsView = this.isPipelineView ? this.renderPipelineView(filteredBots) : this.renderCompactView(filteredBots)

    return (
      <div>
        {hasBots && (
          <Fragment>
            <div className={style.filterWrapper}>
              <InputGroup
                id="input-filter"
                placeholder={lang.tr('admin.workspace.bots.filter')}
                value={this.state.filter}
                onChange={e => this.setState({ filter: e.target.value.toLowerCase() })}
                autoComplete="off"
                className={style.filterField}
              />
              {this.isPipelineView && <Button icon="filter" onClick={this.toggleFilters}></Button>}
            </div>
            {this.state.showFilters && (
              <div className={style.extraFilters}>
                <h2>{lang.tr('admin.workspace.bots.extraFilters')}</h2>
                <Checkbox
                  label={lang.tr('admin.workspace.bots.needYourApproval')}
                  checked={this.state.needApprovalFilter}
                  onChange={e => this.setState({ needApprovalFilter: e.currentTarget.checked })}
                ></Checkbox>
              </div>
            )}

            {this.state.filter && !filteredBots.length && (
              <Callout title={lang.tr('admin.workspace.bots.noBotMatches')} className={style.filterCallout} />
            )}
          </Fragment>
        )}

        {!hasBots && (
          <Callout title={lang.tr('admin.workspace.bots.noBotYet')} className={style.filterCallout}>
            <p>
              <br />
              {lang.tr('admin.workspace.bots.alwaysAssignedToWorkspace')}
              <br />
              {lang.tr('admin.workspace.bots.createYourFirstBot')}
            </p>
          </Callout>
        )}

        {this.hasUnlangedBots() && (
          <Callout intent={Intent.WARNING}>{lang.tr('admin.workspace.bots.noSpecifiedLanguage')}</Callout>
        )}
        {botsView}
      </div>
    )
  }

  get isPipelineView() {
    return this.props.workspace && this.props.workspace.pipeline && this.props.workspace.pipeline.length > 1
  }

  render() {
    if (!this.props.bots) {
      return <LoadingSection />
    }

    return (
      <PageContainer title={lang.tr('admin.workspace.bots.bots')}>
        <SplitPage sideMenu={!this.isPipelineView && this.renderCreateNewBotButton()}>
          <Fragment>
            <Downloader url={this.state.archiveUrl} filename={this.state.archiveName} />
            {this.renderBots()}

            <AccessControl resource="admin.bots.*" operation="write">
              <RollbackBotModal
                botId={this.state.focusedBot}
                isOpen={this.state.isRollbackModalOpen}
                toggle={this.toggleRollbackModal}
                onRollbackSuccess={this.handleRollbackSuccess}
              />
              <EditStageModal
                workspace={this.props.workspace}
                stage={this.state.selectedStage}
                isOpen={this.state.isEditStageModalOpen}
                toggle={this.toggleEditStage}
                onEditSuccess={this.handleEditStageSuccess}
              />
              <CreateBotModal
                isOpen={this.state.isCreateBotModalOpen}
                toggle={this.toggleCreateBotModal}
                existingBots={this.props.bots}
                onCreateBotSuccess={this.props.fetchBots}
              />
              <ImportBotModal
                isOpen={this.state.isImportBotModalOpen}
                toggle={this.toggleImportBotModal}
                onCreateBotSuccess={this.props.fetchBots}
              />
            </AccessControl>
          </Fragment>
        </SplitPage>
      </PageContainer>
    )
  }
}

const mapStateToProps = (state: AppState) => ({
  loadedModules: state.modules.loadedModules,
  bots: state.bots.bots,
  health: state.bots.health,
  workspace: state.bots.workspace,
  loading: state.bots.loadingBots,
  licensing: state.licensing.license,
  profile: state.user.profile,
  language: state.bots.nluLanguages
})

const mapDispatchToProps = {
  fetchBots,
  fetchLicensing,
  fetchBotHealth,
  fetchModules,
  fetchBotNLULanguages
}

const connector = connect(mapStateToProps, mapDispatchToProps)

export default connector(Bots)
