import React, { Component } from 'react'

import { MdInfoOutline } from 'react-icons/lib/md'
import { connect } from 'react-redux'

import { BotEditSchema } from 'common/validation'
import Joi from 'joi'
import Select from 'react-select'
import { Row, Col, Button, FormGroup, Label, Input, Form, Alert, UncontrolledTooltip, Collapse } from 'reactstrap'

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
    avatarUrl: '',
    coverPictureUrl: '',
    category: undefined,
    description: '',
    website: '',
    phoneNumber: '',
    termsConditions: '',
    emailAddress: '',
    error: undefined,
    categories: [],
    moreOpen: false
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
      privacyPolicy: details.privacyPolicy,
      emailAddress: details.emailAddress,
      status: statusList.find(x => x.value === status),
      category: this.state.categories.find(x => x.value === bot.category),
      avatarUrl: details.avatarUrl || '',
      coverPictureUrl: details.coverPictureUrl || ''
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
        emailAddress: this.state.emailAddress,
        avatarUrl: this.state.avatarUrl,
        coverPictureUrl: this.state.coverPictureUrl,
        privacyPolicy: this.state.privacyPolicy
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
      .catch(err => this.setState({ error: err }))

    await this.props.fetchBots()

    this.setState({ successMsg: `Bot configuration updated successfully` })

    window.setTimeout(() => {
      this.setState({ successMsg: undefined })
    }, 2000)
  }

  toggleMoreOpen = () => {
    this.setState({
      moreOpen: !this.state.moreOpen
    })
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
  handleStatusChanged = status => this.setState({ status })
  handleCategoryChanged = category => this.setState({ category })

  handleImageFileChanged = async event => {
    const targetProp = event.target.name
    if (!event.target.files) {
      return
    }

    if (!event.target.files[0].type.includes('image/')) {
      this.setState({
        error: `${targetProp} requires an image file`
      })
      return
    }

    const data = new FormData()
    data.append('file', event.target.files[0])

    if (this.state.error) {
      this.setState({ error: null })
    }

    await api
      .getSecured()
      .post(`/bots/${this.state.botId}/media`, data, { headers: { 'Content-Type': 'multipart/form-data' } })
      .then(response => {
        const url = `${window.location.origin}${response.data.url}`
        this.setState({ [targetProp]: url }, this.saveChanges)
      })
      .catch(err => {
        this.setState({ error: err })
      })
  }

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
                  onChange={this.handleStatusChanged}
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
          <Button color="link" onClick={this.toggleMoreOpen} style={{ marginBottom: '20px' }}>
            More
          </Button>
          <Collapse isOpen={this.state.moreOpen}>
            <Row form>
              <Col md={4}>
                <FormGroup>
                  <Label for="website">
                    <strong>Website</strong>
                  </Label>
                  <Input type="text" name="website" value={this.state.website} onChange={this.handleInputChanged} />
                </FormGroup>
              </Col>
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
            <Row form>
              <Col md={6}>
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
              <Col md={6}>
                <FormGroup>
                  <Label for="termsConditions">
                    <strong>Link to Privacy Policy</strong>
                  </Label>
                  <Input
                    type="text"
                    name="privacyPolicy"
                    value={this.state.privacyPolicy}
                    onChange={this.handleInputChanged}
                  />
                </FormGroup>
              </Col>
            </Row>
            <Row>
              <Col md={7}>
                <Label>
                  <strong>Bot Avatar</strong>
                </Label>
                <Input type="file" accept="image/*" name="avatarUrl" onChange={this.handleImageFileChanged} />
              </Col>
              <Col md={4}>{this.state.avatarUrl && <img height={75} src={this.state.avatarUrl} />}</Col>
            </Row>

            <Row>
              <Col md={4}>
                <Label>
                  <strong>Cover Picture</strong>
                </Label>
                <Input type="file" accept="image/*" name="coverPictureUrl" onChange={this.handleImageFileChanged} />
              </Col>
              <Col md={8}>{this.state.coverPictureUrl && <img width="100%" src={this.state.coverPictureUrl} />}</Col>
            </Row>
          </Collapse>
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
        sideMenu={
          <Button color="primary" onClick={this.saveChanges}>
            Save Details
          </Button>
        }
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
