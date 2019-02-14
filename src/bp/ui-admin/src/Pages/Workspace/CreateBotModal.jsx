import React, { Component } from 'react'
import { connect } from 'react-redux'
import _ from 'lodash'
import { Button, Modal, ModalHeader, ModalBody, FormGroup, FormFeedback, Label, Input } from 'reactstrap'
import { MdGroupAdd } from 'react-icons/lib/md'
import Select from 'react-select'

import api from '../../api'
import { fetchBotTemplates, fetchBotCategories } from '../../reducers/bots'

const defaultState = {
  name: '',
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

  isFormValid = () => {
    return this.formEl && this.formEl.checkValidity() && this.state.template
  }

  handleNameChanged = e => {
    this.setState({ name: e.target.value })
  }

  handleTemplateChanged = template => {
    this.setState({ template })
  }

  handleCategoryChanged = category => {
    this.setState({ category })
  }

  stanitizeName = () => {
    return this.state.name
      .toLowerCase()
      .replace(/\s/g, '-')
      .replace(/[$&+,:;=?@#|'<>.^*()%!]/g, '')
  }

  createBot = async e => {
    e.preventDefault()

    if (!this.isFormValid()) {
      return
    }

    const id = this.stanitizeName()
    const name = this.state.name
    const template = _.pick(this.state.template, ['id', 'moduleId'])
    const category = this.state.category ? this.state.category.value : null

    try {
      await api.getSecured().post(`/admin/bots`, { id, name, template, category })
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
        getOptionLabel={o => o.name}
        getOptionValue={o => o.id}
        options={groupedOptions}
        value={this.state.template}
        onChange={this.handleTemplateChanged}
      />
    )
  }

  render() {
    return (
      <Modal isOpen={this.props.isOpen} toggle={this.props.toggle}>
        <ModalHeader toggle={this.props.toggle}>Create a new bot</ModalHeader>
        <ModalBody>
          <form
            onSubmit={this.createBot}
            ref={form => {
              this.formEl = form
            }}
          >
            <FormGroup>
              <Label for="name">
                <strong>Name</strong>
              </Label>
              <Input required type="text" id="name" value={this.state.name} onChange={this.handleNameChanged} />
              <FormFeedback>The bot name should have at least 4 characters.</FormFeedback>
            </FormGroup>
            {this.props.botTemplates.length > 0 && (
              <FormGroup>
                <Label for="template">
                  <strong>Bot Template</strong>
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
                  options={this.props.botCategories.map(cat => ({ label: cat, value: cat }))}
                  value={this.state.category}
                  onChange={this.handleCategoryChanged}
                />
              </FormGroup>
            )}
            <Button className="float-right" type="submit" color="primary" disabled={!this.isFormValid()}>
              <MdGroupAdd /> Create bot
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
