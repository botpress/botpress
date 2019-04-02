import React, { Component, Fragment } from 'react'

import { IoIosBoxOutline } from 'react-icons/lib/io'
import { MdCreate } from 'react-icons/lib/md'
import { connect } from 'react-redux'
import jdenticon from 'jdenticon'
import { Jumbotron, Row, Col, Badge, Button } from 'reactstrap'

import _ from 'lodash'

import { fetchBots } from '../../../reducers/bots'
import { fetchPermissions } from '../../../reducers/user'

import SectionLayout from '../../Layouts/Section'
import LoadingSection from '../../Components/LoadingSection'

import api from '../../../api'
import { AccessControl } from '../../../App/AccessControl'
import CreateBotModal from '../CreateBotModal'
import Bot from './Bot'

class Bots extends Component {
  state = {
    isCreateBotModalOpen: false,
    errorCreateBot: undefined,
    errorEditBot: undefined,
    id: '',
    name: '',
    description: ''
  }

  renderLoading() {
    return <LoadingSection />
  }

  componentDidMount() {
    this.downloadLink = React.createRef()
    this.props.fetchBots()
    this.props.fetchPermissions()
  }

  toggleCreateBotModal = () => {
    this.setState({ isCreateBotModalOpen: !this.state.isCreateBotModalOpen })
  }

  async exportBot(botId) {
    const { data } = await api.getSecured({ timeout: 10000 })({
      method: 'get',
      url: `/admin/bots/${botId}/export`,
      responseType: 'blob'
    })

    this.setState(
      {
        downloadLinkHref: window.URL.createObjectURL(new Blob([data])),
        downloadLinkFileName: `bot_${botId}_${Date.now()}.tgz`
      },
      () => this.downloadLink.current.click()
    )
  }

  async deleteBot(botId) {
    if (window.confirm("Are you sure you want to delete this bot? This can't be undone.")) {
      await api.getSecured().delete(`/admin/bots/${botId}`)
      await this.props.fetchBots()
    }
  }

  renderEmptyBots() {
    return (
      <div className="bots">
        <Jumbotron>
          <Row>
            <Col style={{ textAlign: 'center' }} sm="12" md={{ size: 8, offset: 2 }}>
              <h1>
                <IoIosBoxOutline />
                &nbsp; This workspace has no bot, yet.
              </h1>
              <p>In Botpress, bots are always assigned to a workspace.</p>
              <p>{this.renderCreateNewBotButton(true)}</p>
            </Col>
          </Row>
        </Jumbotron>
      </div>
    )
  }

  renderCreateNewBotButton(isCentered) {
    return (
      <AccessControl permissions={this.props.permissions} resource="admin.bots.*" operation="write">
        <Button
          className={isCentered ? '' : 'float-right'}
          onClick={() => this.setState({ isCreateBotModalOpen: true })}
          // color="primary"
          size="sm"
        >
          <MdCreate /> Create Bot
        </Button>
      </AccessControl>
    )
  }

  // TODO implement this properly
  async requestPromotion(botId) {
    const { data } = await api.getSecured({ timeout: 10000 })({
      method: 'post',
      url: `/admin/bots/${botId}/promote`
    })

    console.log(data)
  }

  renderBots() {
    return (
      <div className="bp_table">
        {/* TODO change for promoted_on when  https://github.com/botpress/botpress/pull/1633 is merged */}
        {_.orderBy(this.props.bots, 'pipeline_status.current_stage.promoted_at', ['desc']).map(bot => (
          <Bot
            key={bot.id}
            bot={bot}
            requestStageChange={this.requestPromotion.bind(this, bot.id)}
            deleteBot={this.deleteBot.bind(this, bot.id)}
            exportBot={this.exportBot.bind(this, bot.id)}
            permissions={this.props.permissions}
          />
        ))}
      </div>
    )
  }

  render() {
    if (!this.props.bots) {
      return <LoadingSection />
    }

    setTimeout(() => {
      jdenticon()
    }, 10)

    return (
      <Fragment>
        <a ref={this.downloadLink} href={this.state.downloadLinkHref} download={this.state.downloadLinkFileName} />
        <SectionLayout
          title={`Your bots`}
          helpText="This page lists all the bots created under the default workspace."
          activePage="bots"
          currentTeam={this.props.team}
          mainContent={this.props.bots.length > 0 ? this.renderBots() : this.renderEmptyBots()}
          sideMenu={this.renderCreateNewBotButton()}
        />
        <CreateBotModal
          isOpen={this.state.isCreateBotModalOpen}
          toggle={this.toggleCreateBotModal}
          onCreateBotSuccess={this.props.fetchBots}
        />
      </Fragment>
    )
  }
}

const mapStateToProps = state => ({
  bots: state.bots.bots,
  workspace: state.bots.workspace,
  loading: state.bots.loadingBots,
  permissions: state.user.permissions
})

const mapDispatchToProps = {
  fetchBots,
  fetchPermissions
}

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(Bots)
