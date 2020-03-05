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
import { confirmDialog } from 'botpress/shared'
import { ServerHealth, UserProfile } from 'common/typings'
import _ from 'lodash'
import React, { Component, Fragment } from 'react'
import { connect } from 'react-redux'
import { generatePath, RouteComponentProps } from 'react-router'
import { Alert, Col, Row } from 'reactstrap'
import { toastSuccess } from '~/utils/toaster'
import { toastFailure } from '~/utils/toaster'
import { filterList } from '~/utils/util'
import PageContainer from '~/App/PageContainer'
import SplitPage from '~/App/SplitPage'
import { getActiveWorkspace } from '~/Auth'
import { Downloader } from '~/Pages/Components/Downloader'

import api from '../../../api'
import { fetchBotHealth, fetchBots } from '../../../reducers/bots'
import { fetchLicensing } from '../../../reducers/license'
import AccessControl from '../../../App/AccessControl'
import LoadingSection from '../../Components/LoadingSection'

import BotItemCompact from './BotItemCompact'
import BotItemPipeline from './BotItemPipeline'
import CreateBotModal from './CreateBotModal'
import EditStageModal from './EditStageModal'
import ImportBotModal from './ImportBotModal'
import RollbackBotModal from './RollbackBotModal'

const botFilterFields = ['name', 'id', 'description']

interface Props extends RouteComponentProps {
  bots: BotConfig[]
  health: ServerHealth[]
  workspace: any
  fetchBots: () => void
  fetchLicensing: () => void
  fetchBotHealth: () => void
  licensing: any
  profile: UserProfile
}

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

    if (!this.props.licensing) {
      this.props.fetchLicensing()
    }
  }

  toggleCreateBotModal = () => {
    this.setState({ isCreateBotModalOpen: !this.state.isCreateBotModalOpen })
  }

  toggleImportBotModal = () => {
    this.setState({ isImportBotModalOpen: !this.state.isImportBotModalOpen })
  }

  async exportBot(botId) {
    this.setState({
      archiveUrl: `/admin/bots/${botId}/export`,
      archiveName: `bot_${botId}_${Date.now()}.tgz`
    })
  }

  async deleteBot(botId) {
    if (
      await confirmDialog("Are you sure you want to delete this bot? This can't be undone.", {
        acceptLabel: 'Delete'
      })
    ) {
      await api.getSecured().post(`/admin/bots/${botId}/delete`)
      this.props.fetchBots()
    }
  }

  async reloadBot(botId: string) {
    try {
      await api.getSecured().post(`/admin/bots/${botId}/reload`)
      this.props.fetchBots()
      this.props.fetchBotHealth()
      toastSuccess(`Bot remounted successfully`)
    } catch (err) {
      console.log(err)
      toastFailure(`Could not mount bot. Check server logs for details`)
    }
  }

  viewLogs(botId: string) {
    this.props.history.push(
      generatePath(`/workspace/:workspaceId?/logs?botId=:botId`, {
        workspaceId: getActiveWorkspace() || undefined,
        botId
      })
    )
  }

  renderCreateNewBotButton() {
    return (
      <AccessControl resource="admin.bots.*" operation="write">
        <Popover minimal interactionKind={PopoverInteractionKind.HOVER} position={Position.BOTTOM}>
          <Button id="btn-create-bot" intent={Intent.NONE} text="Create Bot" rightIcon="caret-down" />
          <ButtonGroup vertical={true} minimal={true} fill={true} alignText={Alignment.LEFT}>
            <Button
              id="btn-new-bot"
              text="New Bot"
              icon="add"
              onClick={() => this.setState({ isCreateBotModalOpen: true })}
            />
            <Button
              id="btn-import-bot"
              text="Import Existing"
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

  async requestStageChange(botId) {
    await api.getSecured({ timeout: 60000 }).post(`/admin/bots/${botId}/stage`)
    this.props.fetchBots()
    toastSuccess('Bot promoted to next stage')
  }

  async approveStageChange(botId) {
    await api.getSecured({ timeout: 60000 }).post(`/admin/bots/${botId}/approve-stage`)
    this.props.fetchBots()
    toastSuccess('Approved bot promotion to next stage')
  }

  isLicensed = () => {
    return _.get(this.props.licensing, 'status') === 'licensed'
  }

  async createRevision(botId) {
    await api.getSecured().post(`admin/bots/${botId}/revisions`)
    toastSuccess('Revisions created')
  }

  toggleRollbackModal = (botId?: string) => {
    this.setState({
      focusedBot: typeof botId === 'string' ? botId : null,
      isRollbackModalOpen: !this.state.isRollbackModalOpen
    })
  }

  handleRollbackSuccess = () => {
    this.props.fetchBots()
    toastSuccess('Rollback success')
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
      <div className="bp_table bot_views compact_view">
        {bots.map(bot => (
          <Fragment key={bot.id}>
            <BotItemCompact
              bot={bot}
              hasError={this.findBotError(bot.id)}
              deleteBot={this.deleteBot.bind(this, bot.id)}
              exportBot={this.exportBot.bind(this, bot.id)}
              createRevision={this.createRevision.bind(this, bot.id)}
              rollback={this.toggleRollbackModal.bind(this, bot.id)}
              reloadBot={this.reloadBot.bind(this, bot.id)}
              viewLogs={this.viewLogs.bind(this, bot.id)}
            />
          </Fragment>
        ))}
      </div>
    )
  }

  renderPipelineView(bots: BotConfig[]) {
    const {
      workspace: { pipeline },
      profile: { email, strategy }
    } = this.props
    const botsByStage = _.groupBy(bots, 'pipeline_status.current_stage.id')
    const colSize = Math.floor(12 / pipeline.length)

    return (
      <Fragment>
        <Row className="pipeline_view bot_views">
          {pipeline.map((stage, idx) => {
            const allowStageChange = this.isLicensed() && idx !== pipeline.length - 1
            return (
              <Col key={stage.id} md={colSize}>
                {pipeline.length > 1 && (
                  <div className="pipeline_title">
                    <h3>{stage.label}</h3>
                    <AccessControl resource="admin.bots.*" operation="write" superAdmin>
                      <Button className="pipeline_edit-button" onClick={() => this.toggleEditStage(stage)}>
                        <Icon icon="edit" />
                      </Button>
                    </AccessControl>
                  </div>
                )}
                {idx === 0 && <div className="pipeline_bot create">{this.renderCreateNewBotButton()}</div>}
                {(botsByStage[stage.id] || []).map(bot => (
                  <Fragment key={bot.id}>
                    <BotItemPipeline
                      bot={bot}
                      isApprover={stage.reviewers.find(r => r.email === email && r.strategy === strategy) !== undefined}
                      userEmail={email}
                      userStrategy={strategy}
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
                    />
                  </Fragment>
                ))}
              </Col>
            )
          })}
        </Row>
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
    const { email, strategy } = this.props.profile

    const filteredBots = filterList<BotConfig>(this.props.bots, botFilterFields, this.state.filter).filter(x =>
      this.filterStageApproval(x, email, strategy)
    )

    const hasBots = !!this.props.bots.length
    const botsView = this.isPipelineView ? this.renderPipelineView(filteredBots) : this.renderCompactView(filteredBots)

    return (
      <div>
        {hasBots && (
          <Fragment>
            <div className="filterWrapper">
              <InputGroup
                id="input-filter"
                placeholder="Filter bots"
                value={this.state.filter}
                onChange={e => this.setState({ filter: e.target.value.toLowerCase() })}
                autoComplete="off"
                className="filterField"
              />
              {this.isPipelineView && <Button icon="filter" onClick={this.toggleFilters}></Button>}
            </div>
            {this.state.showFilters && (
              <div className="extraFilters">
                <h2>Extra filters</h2>
                <Checkbox
                  label="Need your approval"
                  checked={this.state.needApprovalFilter}
                  onChange={e => this.setState({ needApprovalFilter: e.currentTarget.checked })}
                ></Checkbox>
              </div>
            )}

            {this.state.filter && !filteredBots.length && (
              <Callout title="No bot matches your query" className="filterCallout" />
            )}
          </Fragment>
        )}

        {!hasBots && (
          <Callout title="This workspace has no bots, yet" className="filterCallout">
            <p>
              <br />
              In Botpress, bots are always assigned to a workspace.
              <br />
              Create your first bot to start building.
            </p>
          </Callout>
        )}

        {this.hasUnlangedBots() && (
          <Alert color="warning">
            You have bots without specified language. Default language is mandatory since Botpress 11.8. Please set bot
            language in the bot config page.
          </Alert>
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
      <PageContainer title="Bots">
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

const mapStateToProps = state => ({
  bots: state.bots.bots,
  health: state.bots.health,
  workspace: state.bots.workspace,
  loading: state.bots.loadingBots,
  licensing: state.license.licensing,
  profile: state.user.profile
})

const mapDispatchToProps = {
  fetchBots,
  fetchLicensing,
  fetchBotHealth
}

export default connect(mapStateToProps, mapDispatchToProps)(Bots)
