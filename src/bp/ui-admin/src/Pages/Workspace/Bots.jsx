import React, { Component, Fragment } from 'react'

import { IoIosBoxOutline } from 'react-icons/lib/io'
import { MdCreate } from 'react-icons/lib/md'
import { connect } from 'react-redux'
import jdenticon from 'jdenticon'
import { BotEditSchema } from 'common/validation'
import Joi from 'joi'
import {
  Jumbotron,
  Row,
  Col,
  Button,
  Modal,
  ModalHeader,
  ModalBody,
  ModalFooter,
  FormGroup,
  FormFeedback,
  Label,
  Input
} from 'reactstrap'

import _ from 'lodash'

import { fetchBots } from '../../reducers/bots'
import { fetchPermissions } from '../../reducers/user'

import SectionLayout from '../Layouts/Section'
import LoadingSection from '../Components/LoadingSection'

import api from '../../api'
import { AccessControl } from '../../App/AccessControl'
import CreateBotModal from './CreateBotModal'

class Bots extends Component {
  state = {
    isEditBotModalOpen: false,
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
    this.props.fetchBots()
    this.props.fetchPermissions()
  }

  editBot = async () => {
    const id = this.state.id
    const name = this.state.name
    const description = this.state.description

    const { error } = Joi.validate({ name, description }, BotEditSchema)
    if (error) {
      this.setState({ errorEditBot: error })
      return
    }

    await api
      .getSecured()
      .put(`/admin/bots/${id}`, {
        name,
        description
      })
      .catch(err => this.setState({ errorEditBot: err }))
    await this.props.fetchBots()
    this.toggleEditBotModal()
  }

  toggleCreateBotModal = () => {
    this.setState({ isCreateBotModalOpen: !this.state.isCreateBotModalOpen })
  }

  toggleEditBotModal = async bot => {
    if (this.state.isEditBotModalOpen) {
      this.setState({
        isEditBotModalOpen: false,
        id: '',
        name: '',
        description: ''
      })
    } else {
      this.setState({
        isEditBotModalOpen: true,
        id: bot.id,
        name: bot.name,
        description: bot.description
      })
    }
  }

  renderEditBot() {
    return (
      <Modal isOpen={this.state.isEditBotModalOpen} toggle={this.toggleEditBotModal}>
        <ModalHeader toggle={this.toggleEditBotModal}>Edit {this.state.name}</ModalHeader>
        <ModalBody>
          <FormGroup>
            <Label for="name">
              <strong>Name</strong>
            </Label>
            <Input
              type="text"
              id="name"
              value={this.state.name}
              invalid={this.state.errorEditBot || false}
              onChange={e => this.setState({ name: e.target.value })}
            />
            <FormFeedback>The bot name should have at least 4 characters.</FormFeedback>
          </FormGroup>
          <FormGroup>
            <Label for="description">
              <strong>Description</strong>
            </Label>
            <Input
              type="text"
              id="description"
              value={this.state.description}
              invalid={this.state.errorEditBot || false}
              onChange={e => this.setState({ description: e.target.value })}
            />
            <FormFeedback>The description should have at least 4 characters.</FormFeedback>
          </FormGroup>
        </ModalBody>
        <ModalFooter>
          <Button color="primary" onClick={this.editBot}>
            Edit
          </Button>
        </ModalFooter>
      </Modal>
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
          color="primary"
          size="sm"
        >
          <MdCreate /> Create Bot
        </Button>
      </AccessControl>
    )
  }

  renderBots() {
    return (
      <div className="bp_table">
        {_.orderBy(this.props.bots, ['id'], ['desc']).map(bot => (
          <div className="bp_table-row" key={bot.id}>
            <div className="actions">
              <AccessControl permissions={this.props.permissions} resource="admin.bots.*" operation="write">
                <Button size="sm" color="link" onClick={() => this.toggleEditBotModal(bot)}>
                  Edit
                </Button>
                |
                <Button size="sm" color="link" onClick={() => this.deleteBot(bot.id)}>
                  Delete
                </Button>
              </AccessControl>
            </div>
            <div className="title">
              <a href={`/studio/${bot.id}`}>{bot.name}</a>
            </div>
            <p>{bot.description}</p>
          </div>
        ))}
        {this.renderEditBot()}
      </div>
    )
  }

  renderSideMenu() {
    return null
  }

  render() {
    if (!this.props.bots) {
      return this.renderLoading()
    }

    setTimeout(() => {
      jdenticon()
    }, 10)

    return (
      <Fragment>
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
