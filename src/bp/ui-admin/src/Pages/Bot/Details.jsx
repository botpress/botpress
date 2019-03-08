import React, { Component } from 'react'

import { MdInfoOutline } from 'react-icons/lib/md'
import { connect } from 'react-redux'

import { BotEditSchema } from 'common/validation'
import Joi from 'joi'
import Select from 'react-select'
import { Row, Col, Button, FormGroup, Label, Input, Form, UncontrolledTooltip, Alert } from 'reactstrap'

import _ from 'lodash'

import { fetchBots, fetchBotCategories } from '../../reducers/bots'

import SectionLayout from '../Layouts/Section'

import api from '../../api'

const statusList = [
  { label: 'Public', value: 'public' },
  { label: 'Private', value: 'private' },
  { label: 'Disabled', value: 'disabled' }
]

class Bots extends Component {
  state = {
    id: '',
    name: '',
    category: undefined,
    description: '',
    website: '',
    phoneNumber: '',
    termsConditions: '',
    emailAddress: '',
    error: undefined,
    categories: []
  }

  componentDidMount() {
    if (!this.props.botCategoriesFetched) {
      this.props.fetchBotCategories()
    }

    this.props.fetchBots()
    this.prepareCategories()
  }

  componentDidUpdate(prevProps) {
    if (prevProps.bots !== this.props.bots) {
      this.loadBot()
    }
    if (prevProps.botCategories !== this.props.botCategories) {
      this.prepareCategories()
    }
  }

  prepareCategories = () => {
    if (this.props.botCategories) {
      this.setState({ categories: this.props.botCategories.map(cat => ({ label: cat, value: cat })) })
    }
  }

  loadBot() {
    const botId = this.props.match.params.botId
    const bot = this.props.bots.find(bot => bot.id === botId)
    const status = bot.disabled ? 'disabled' : bot.private ? 'private' : 'public'
    const details = _.get(bot, 'details', {})

    this.setState({
      botId,
      name: bot.name,
      description: bot.description,
      website: details.website,
      phoneNumber: details.phoneNumber,
      termsConditions: details.termsConditions,
      emailAddress: details.emailAddress,
      status: statusList.find(x => x.value === status),
      category: this.state.categories.find(x => x.value === bot.category)
    })
  }

  saveChanges = async () => {
    this.setState({ error: undefined })

    const bot = {
      name: this.state.name,
      description: this.state.description,
      category: this.state.category && this.state.category.value,
      details: {
        website: this.state.website,
        phoneNumber: this.state.phoneNumber,
        termsConditions: this.state.termsConditions,
        emailAddress: this.state.emailAddress
      }
    }

    const status = this.state.status && this.state.status.value
    if (status === 'disabled') {
      bot.disabled = true
    } else {
      bot.disabled = false
      bot.private = status === 'private'
    }

    const { error } = Joi.validate(bot, BotEditSchema)
    if (error) {
      this.setState({ error: error })
      return
    }

    await api
      .getSecured()
      .put(`/admin/bots/${this.state.botId}`, bot)
      .catch(err => this.setState({ errorMessage: err }))

    await this.props.fetchBots()

    this.setState({ successMsg: `Bot configuration updated successfully` })

    window.setTimeout(() => {
      this.setState({ successMsg: undefined })
    }, 2000)
  }

  renderHelp(text, id) {
    return (
      <span>
        <MdInfoOutline id={`help${id}`} className="section-title-help" />
        <UncontrolledTooltip placement="right" target={`help${id}`}>
          {text}
        </UncontrolledTooltip>
      </span>
    )
  }

  handleInputChanged = event => this.setState({ [event.target.name]: event.target.value })
  handleChangedLanguage = status => this.setState({ status })
  handleCategoryChanged = category => this.setState({ category })

  renderDetails() {
    return (
      <div>
        {this.state.error && <Alert color="danger">{this.state.error.message}</Alert>}
        {this.state.successMsg && <Alert type="success">{this.state.successMsg}</Alert>}
        <Form>
          <Row form>
            <Col md={5}>
              <FormGroup>
                <Label for="name">
                  <strong>Name</strong>
                </Label>
                <Input type="text" name="name" value={this.state.name} onChange={this.handleInputChanged} />
              </FormGroup>
            </Col>
            <Col md={4}>
              {!!this.state.categories.length && (
                <FormGroup>
                  <Label>
                    <strong>Category</strong>
                  </Label>
                  <Select
                    options={this.state.categories}
                    value={this.state.category}
                    onChange={this.handleCategoryChanged}
                  />
                </FormGroup>
              )}
            </Col>
            <Col md={3}>
              <FormGroup>
                <Label for="status">
                  <strong>Status</strong>
                  {this.renderHelp(
                    `Public bots can be accessed by anyone, while private are only accessible by authenticated users`
                  )}
                </Label>
                <Select
                  options={statusList}
                  value={this.state.status}
                  onChange={this.handleChangedLanguage}
                  isSearchable={false}
                />
              </FormGroup>
            </Col>
          </Row>
          <FormGroup>
            <Label for="description">
              <strong>Description</strong>
            </Label>
            <Input
              type="textarea"
              name="description"
              value={this.state.description}
              onChange={this.handleInputChanged}
            />
          </FormGroup>

          <Row form>
            <Col md={7}>
              <FormGroup>
                <Label for="website">
                  <strong>Website</strong>
                </Label>
                <Input type="text" name="website" value={this.state.website} onChange={this.handleInputChanged} />
              </FormGroup>
            </Col>
            <Col md={1} />
            <Col md={4}>
              <FormGroup>
                <Label for="phoneNumber">
                  <strong>Phone Number</strong>
                </Label>
                <Input
                  type="text"
                  name="phoneNumber"
                  value={this.state.phoneNumber}
                  onChange={this.handleInputChanged}
                />
              </FormGroup>
            </Col>
          </Row>

          <Row form>
            <Col md={7}>
              <FormGroup>
                <Label for="termsConditions">
                  <strong>Link to Terms & Conditions</strong>
                </Label>
                <Input
                  type="text"
                  name="termsConditions"
                  value={this.state.termsConditions}
                  onChange={this.handleInputChanged}
                />
              </FormGroup>
            </Col>
            <Col md={1} />
            <Col md={4}>
              <FormGroup>
                <Label for="emailAddress">
                  <strong>Contact E-mail</strong>
                </Label>
                <Input
                  type="text"
                  name="emailAddress"
                  value={this.state.emailAddress}
                  onChange={this.handleInputChanged}
                />
              </FormGroup>
            </Col>
          </Row>

          <Button color="primary" onClick={this.saveChanges}>
            Save
          </Button>
        </Form>
      </div>
    )
  }

  render() {
    return (
      <SectionLayout
        title={this.state.name}
        helpText="This page shows the details you can configure for a desired bot."
        activePage="bots"
        currentTeam={this.props.team}
        mainContent={this.renderDetails()}
        sideMenu={null}
      />
    )
  }
}

const mapStateToProps = state => ({
  bots: state.bots.bots,
  botCategories: state.bots.botCategories,
  botCategoriesFetched: state.bots.botCategoriesFetched
})

const mapDispatchToProps = {
  fetchBots,
  fetchBotCategories
}

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(Bots)
