import React, { Component } from 'react'
import { connect } from 'react-redux'
import _ from 'lodash'
import { Button, Modal, ModalHeader, ModalBody, FormGroup, FormFeedback, Label, Input } from 'reactstrap'
import Select from 'react-select'

import api from '../../../api'
import { fetchBotTemplates, fetchBotCategories } from '../../../reducers/bots'
import { FaPlusCircle } from 'react-icons/fa'

const defaultState = {
  botId: '',
  name: '',
  generateId: true,
  template: null,
  category: null,
  error: null
}

class CreateBotModal extends Component {
  state = { ...defaultState }

  componentDidMount() {
    if (!this.props.botCategoriesFetched) {
      this.props.fetchBotCategories()
    }
    if (!this.props.templateFetched) {
      this.props.fetchBotTemplates()
    }
  }

  focus = () => {
    this.nameInput.focus()
  }

  isFormValid = () => {
    return this.formEl && this.formEl.checkValidity() && this.state.template
  }

  handleNameChanged = e => {
    const name = e.target.value
    this.setState({ name, botId: this.state.generateId ? this.sanitizeBotId(name) : this.state.botId })
  }

  handleBotIdChanged = e => this.setState({ botId: this.sanitizeBotId(e.target.value), generateId: false })
  handleTemplateChanged = template => this.setState({ template })
  handleCategoryChanged = category => this.setState({ category })

  sanitizeBotId = text => {
    return text
      .toLowerCase()
      .replace(/\s/g, '-')
      .replace(/[^a-z0-9_-]/g, '')
  }

  createBot = async e => {
    e.preventDefault()

    if (!this.isFormValid()) {
      return
    }

    const { botId, name } = this.state

    const template = _.pick(this.state.template, ['id', 'moduleId'])
    const category = this.state.category ? this.state.category.value : null

    try {
      await api.getSecured().post(`/admin/bots`, { id: botId, name, template, category })
      this.setState({ ...defaultState })
      this.props.onCreateBotSuccess && this.props.onCreateBotSuccess()
      this.props.toggle()
    } catch (error) {
      this.setState({ error: error.message })
    }
  }

  renderTemplateGroupSelect = () => {
    const templatesByModule = _.groupBy(this.props.botTemplates, 'moduleName')
    const groupedOptions = _.toPairs(templatesByModule).map(g => ({
      label: g[0],
      options: g[1]
    }))

    return (
      <Select
        tabIndex="2"
        getOptionLabel={o => o.name}
        getOptionValue={o => o.id}
        options={groupedOptions}
        value={this.state.template}
        onChange={this.handleTemplateChanged}
      />
    )
  }

  toggle = () => {
    this.setState({ ...defaultState })
    this.props.toggle()
  }

  render() {
    return (
      <Modal isOpen={this.props.isOpen} toggle={this.toggle} fade={false} onOpened={this.focus}>
        <ModalHeader toggle={this.props.toggle}>Create a new bot</ModalHeader>
        <ModalBody>
          <form onSubmit={this.createBot} ref={form => (this.formEl = form)}>
            <FormGroup>
              <Label for="name">
                <strong>Name of your bot</strong>
                <br />
                <small>
                  It will be displayed to your visitors. You can change it anytime. If you put nothing, it will be named
                  "Bot" by default.
                </small>
              </Label>
              <Input
                tabIndex="1"
                innerRef={el => (this.nameInput = el)}
                type="text"
                id="name"
                value={this.state.name}
                onChange={this.handleNameChanged}
              />
              <FormFeedback>The bot name should have at least 4 characters.</FormFeedback>
            </FormGroup>

            <FormGroup>
              <Label for="id">
                <strong>Your bot ID *</strong>
                <br />
                <small>
                  This ID cannot be changed, so choose wisely. It will be displayed in the URL and your visitors can see
                  it. Special characters are not allowed. Minimum length: 3
                </small>
              </Label>
              <Input
                tabIndex="2"
                required
                type="text"
                minLength={3}
                value={this.state.botId}
                onChange={this.handleBotIdChanged}
              />
              <FormFeedback>The bot id should have at least 4 characters.</FormFeedback>
            </FormGroup>
            {this.props.botTemplates.length > 0 && (
              <FormGroup>
                <Label for="template">
                  <strong>Bot Template *</strong>
                </Label>
                {this.renderTemplateGroupSelect()}
              </FormGroup>
            )}
            {this.props.botCategories.length > 0 && (
              <FormGroup>
                <Label for="category">
                  <strong>Bot Category</strong>
                </Label>
                <Select
                  tabIndex="3"
                  options={this.props.botCategories.map(cat => ({ label: cat, value: cat }))}
                  value={this.state.category}
                  onChange={this.handleCategoryChanged}
                />
              </FormGroup>
            )}
            <Button tabIndex="4" className="float-right" type="submit" color="primary" disabled={!this.isFormValid()}>
              <FaPlusCircle /> Create bot
            </Button>
          </form>
          {!!this.state.error && <p className="text-danger">{this.state.error}</p>}
        </ModalBody>
      </Modal>
    )
  }
}

const mapStateToProps = state => ({
  ...state.bots
})

const mapDispatchToProps = {
  fetchBotTemplates,
  fetchBotCategories
}

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(CreateBotModal)
