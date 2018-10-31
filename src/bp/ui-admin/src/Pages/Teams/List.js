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
  ModalHeader,
  ModalBody,
  ModalFooter,
  Row,
  Col
} from 'reactstrap'

import moment from 'moment'
import { MdGroupAdd } from 'react-icons/lib/md'
import { fetchTeams } from '../../modules/teams'
import SectionLayout from '../Layouts/Section'
import LoadingSection from '../Components/LoadingSection'
import api from '../../api'
import ProfileUpdate from '../Components/ProfileUpdate'

// TODO We can reuse this logic between Node and Front
const TeamNameValidationSchema = Joi.string()
  .regex(/^[0-9A-Za-z _-]+$/)
  .trim()
  .min(3)
  .max(30)

class List extends Component {
  state = { isCreateTeamModalOpen: false, canCreateTeam: false, teamName: '', createTeamError: null }

  componentDidMount() {
    !this.props.teams && this.props.fetchTeams()
  }

  componentDidUpdate(prevProps) {
    if (prevProps.teams !== this.props.teams) {
      !this.props.teams && this.props.fetchTeams()
    }
  }

  toggleCreateTeamModalOpen = () => {
    this.setState({ isCreateTeamModalOpen: !this.state.isCreateTeamModalOpen })
  }

  onInputKeyPress = e => e.key === 'Enter' && this.createTeam()

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
              onKeyPress={this.onInputKeyPress}
              invalid={!!this.state.createTeamError}
              value={this.state.teamName}
            />
            {!!this.state.createTeamError && <FormFeedback>{this.state.createTeamError.message}</FormFeedback>}
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
      <Row>
        <Col xs={12} md={8}>
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
        </Col>
      </Row>
    )
  }

  renderSideMenu() {
    return (
      <div>
        <Button className="float-right" color="primary" size="sm" onClick={this.toggleCreateTeamModalOpen}>
          <MdGroupAdd /> Create team
        </Button>
        {this.renderCreateTeamModal()}
        <ProfileUpdate renderAsModal="true" />
      </div>
    )
  }

  render() {
    const renderLoading = () => <LoadingSection />

    return (
      <SectionLayout
        title="My teams"
        helpText="These are the teams you are a member of.
          You can join an existing team by asking someone you know, or you can create your own team and invite others to
          collaborate with you."
        activePage="teams"
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
