import React, { Component } from 'react'
import { bindActionCreators } from 'redux'
import { connect } from 'react-redux'
import Joi from 'joi-browser'

import {
  ListGroup,
  ListGroupItem,
  ListGroupItemHeading,
  Button,
  Modal,
  FormGroup,
  Input,
  Label,
  FormFeedback,
  FormText,
  ModalHeader,
  ModalBody,
  ModalFooter
} from 'reactstrap'

import moment from 'moment'
import { MdGroupAdd } from 'react-icons/lib/md'

import { fetchTeams } from '../../modules/teams'

import SectionLayout from '../Layouts/Section'
import LoadingSection from '../Components/LoadingSection'

import _ from 'lodash'

import api from '../../api'

// TODO We can reuse this logic between Node and Front
const TeamNameValidationSchema = Joi.string()
  .regex(/^[0-9A-Za-z _-]+$/)
  .trim()
  .min(3)
  .max(30)

class List extends Component {
  state = { isCreateTeamModalOpen: false, canCreateTeam: false, teamName: '', createTeamError: null }

  componentDidMount() {
    this.props.fetchTeams()
  }

  componentDidUpdate(prevProps) {
    if (!prevProps.teams) {
      this.props.fetchTeams()
    }
  }

  async joinTeam(inviteCode) {
    await api.getSecured({ toastErrors: false }).post(`/api/teams/join`, {
      code: inviteCode
    })
  }

  // TODO: refactor https://reactjs.org/docs/react-component.html#unsafe_componentwillreceiveprops
  async componentWillReceiveProps(nextProps) {
    const inviteCode = _.get(nextProps, 'match.params.inviteCode')
    if (inviteCode) {
      await this.joinTeam(inviteCode)
      this.props.history.push(`/teams`)
    }
  }

  toggleCreateTeamModalOpen = () => {
    this.setState({ isCreateTeamModalOpen: !this.state.isCreateTeamModalOpen })
  }

  onTeamNameChange = event => {
    const { error } = Joi.validate(event.target.value, TeamNameValidationSchema)

    this.setState({
      teamName: event.target.value,
      canCreateTeam: !error,
      createTeamError: error
    })
  }

  async createTeam() {
    await api.getSecured().post('/api/teams', {
      name: this.state.teamName
    })
    this.setState({ isCreateTeamModalOpen: false, teamName: '', canCreateTeam: false, createTeamError: null })
    await this.props.fetchTeams()
  }

  renderCreateTeamModal() {
    return (
      <Modal isOpen={this.state.isCreateTeamModalOpen} toggle={this.toggleCreateTeamModalOpen}>
        <ModalHeader toggle={this.toggleCreateTeamModalOpen}>Create a new team</ModalHeader>
        <ModalBody>
          <FormGroup>
            <Label for="teamName">Team name</Label>
            <Input
              id="teamName"
              onChange={this.onTeamNameChange}
              invalid={!!this.state.createTeamError}
              value={this.state.teamName}
            />
            {!!this.state.createTeamError && <FormFeedback>{this.state.createTeamError.message}</FormFeedback>}
            <FormText>You can change that name later</FormText>
          </FormGroup>
        </ModalBody>
        <ModalFooter>
          <Button color="primary" disabled={!this.state.canCreateTeam} onClick={() => this.createTeam()}>
            <MdGroupAdd /> Create
          </Button>
        </ModalFooter>
      </Modal>
    )
  }

  renderAllTeams() {
    return (
      <ListGroup>
        {this.props.teams.map(team => {
          const createdAgo = moment(team.createdAt).fromNow()
          return (
            <ListGroupItem
              tag="a"
              key={team.id}
              action
              href="#"
              onClick={() => this.props.history.push(`/teams/${team.id}`)}
            >
              <ListGroupItemHeading>{team.name}</ListGroupItemHeading>
              <small>Created {createdAgo}</small>
            </ListGroupItem>
          )
        })}
      </ListGroup>
    )
  }

  renderSideMenu() {
    return (
      <div>
        <Button color="primary" outline onClick={this.toggleCreateTeamModalOpen}>
          <MdGroupAdd /> Create team
        </Button>
        {this.renderCreateTeamModal()}
      </div>
    )
  }

  render() {
    const renderLoading = () => <LoadingSection />

    const sections = [
      { title: 'Teams', active: true, link: '/teams' },
      { title: 'Profile', active: false, link: '/me' }
    ]

    return (
      <SectionLayout
        title="My teams"
        helpText="These are the teams you are a member of.
          You can join an existing team by asking someone you know for an
          invite code, or you can create your own team and invite others to
          collaborate with you."
        sections={sections}
        mainContent={!this.props.teams || this.props.loading ? renderLoading() : this.renderAllTeams()}
        sideMenu={this.renderSideMenu()}
      />
    )
  }
}

const mapStateToProps = state => ({
  teams: state.teams.items,
  loading: state.teams.loadingTeams
})

const mapDispatchToProps = dispatch =>
  bindActionCreators(
    {
      fetchTeams
    },
    dispatch
  )

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(List)
