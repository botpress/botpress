import { Button, Classes, Dialog, FormGroup, InputGroup, Intent } from '@blueprintjs/core'
import { BotTemplate } from 'botpress/sdk'
import _ from 'lodash'
import React, { Component } from 'react'
import { connect } from 'react-redux'
import Select from 'react-select'

import api from '../../../api'
import { fetchBotCategories, fetchBotTemplates } from '../../../reducers/bots'

export const sanitizeBotId = (text: string) =>
  text
    .toLowerCase()
    .replace(/\s/g, '-')
    .replace(/[^a-z0-9_-]/g, '')

type SelectOption<T> = { label: string; value: T; __isNew__?: boolean }

interface OwnProps {
  isOpen: boolean
  onCreateBotSuccess: () => void
  toggle: () => void
}

interface DispatchProps {
  fetchBotCategories: () => void
  fetchBotTemplates: () => void
}

interface StateProps {
  botCategoriesFetched: boolean
  botTemplatesFetched: boolean
  botTemplates: BotTemplate[]
  botCategories: string[]
}

type Props = DispatchProps & StateProps & OwnProps

interface State {
  botId: string
  botName: string
  isProcessing: boolean
  generateId: boolean

  error: any

  templates: any
  categories: SelectOption<string>[]

  selectedTemplate?: BotTemplate
  selectedCategory?: SelectOption<string>
}

const defaultState = {
  botId: '',
  botName: '',
  selectedCategory: undefined,
  selectedTemplate: undefined,
  error: undefined,
  isProcessing: false,
  generateId: true
}

class CreateBotModal extends Component<Props, State> {
  private _form: HTMLFormElement | null = null

  state: State = {
    templates: [],
    categories: [],
    ...defaultState
  }

  componentDidMount() {
    this.loadCategories()
    this.loadTemplates()
  }

  componentDidUpdate(prevProps: Props) {
    if (!prevProps.botTemplatesFetched && this.props.botTemplatesFetched) {
      this.loadTemplates()
    }
    if (!prevProps.botCategoriesFetched && this.props.botCategoriesFetched) {
      this.loadCategories()
    }
  }

  loadCategories() {
    if (!this.props.botCategoriesFetched) {
      return this.props.fetchBotCategories()
    }

    const categories = this.props.botCategories.map(x => ({ value: x, label: x }))
    this.setState({ categories, selectedCategory: undefined })
  }

  loadTemplates() {
    if (!this.props.botTemplatesFetched) {
      return this.props.fetchBotTemplates()
    }

    const templatesByModule = _.groupBy(this.props.botTemplates, 'moduleName')
    const groupedOptions = _.toPairs(templatesByModule).map(g => ({ label: g[0], options: g[1] }))

    this.setState({ templates: groupedOptions, selectedTemplate: undefined })
  }

  handleNameChanged = e => {
    const botName = e.target.value
    this.setState({ botName, botId: this.state.generateId ? sanitizeBotId(botName) : this.state.botId })
  }

  handleBotIdChanged = e => this.setState({ botId: sanitizeBotId(e.target.value), generateId: false })

  createBot = async e => {
    e.preventDefault()
    if (this.isButtonDisabled) {
      return
    }
    this.setState({ isProcessing: true })

    const newBot = {
      id: this.state.botId,
      name: this.state.botName,
      template: _.pick(this.state.selectedTemplate, ['id', 'moduleId']),
      category: this.state.selectedCategory && this.state.selectedCategory.value
    }

    try {
      await api.getSecured().post(`/admin/bots`, newBot)
      this.props.onCreateBotSuccess()
      this.toggleDialog()
    } catch (error) {
      this.setState({ error: error.message, isProcessing: false })
    }
  }

  toggleDialog = () => {
    this.setState({ ...defaultState })
    this.props.toggle()
  }

  get isButtonDisabled() {
    const { isProcessing, botId, botName, selectedTemplate } = this.state
    return isProcessing || !botId || !botName || !selectedTemplate || !this._form || !this._form.checkValidity()
  }

  render() {
    return (
      <Dialog
        title="Create a new bot"
        icon="add"
        isOpen={this.props.isOpen}
        onClose={this.toggleDialog}
        transitionDuration={0}
        canOutsideClickClose={false}
      >
        <form ref={form => (this._form = form)}>
          <div className={Classes.DIALOG_BODY}>
            <FormGroup
              label="Bot Name"
              labelFor="bot-name"
              labelInfo="*"
              helperText={`It will be displayed to your visitors. You can change it anytime. If you put nothing, it will be named
            "Bot" by default.`}
            >
              <InputGroup
                id="input-bot-name"
                tabIndex={1}
                placeholder="The name of your bot"
                minLength={3}
                required
                value={this.state.botName}
                onChange={this.handleNameChanged}
                autoFocus
              />
            </FormGroup>

            <FormGroup
              label="Bot ID"
              labelFor="botid"
              labelInfo="*"
              helperText="This ID cannot be changed, so choose wisely. It will be displayed in the URL and your visitors can see it.
              Special characters are not allowed. Minimum length: 3"
            >
              <InputGroup
                id="botid"
                tabIndex={2}
                placeholder="The ID of your bot (must be unique)"
                minLength={3}
                required
                value={this.state.botId}
                onChange={this.handleBotIdChanged}
              />
            </FormGroup>

            {this.state.templates.length > 0 && (
              <FormGroup label="Bot Template" labelFor="template">
                <Select
                  id="select-bot-templates"
                  tabIndex="3"
                  options={this.state.templates}
                  value={this.state.selectedTemplate}
                  onChange={selectedTemplate => this.setState({ selectedTemplate: selectedTemplate as any })}
                  getOptionLabel={o => o.name}
                  getOptionValue={o => o.id}
                />
              </FormGroup>
            )}
            {this.state.categories.length > 0 && (
              <FormGroup label="Bot Category">
                <Select
                  tabIndex="4"
                  options={this.state.categories}
                  value={this.state.selectedCategory}
                  onChange={selectedCategory => this.setState({ selectedCategory: selectedCategory as any })}
                />
              </FormGroup>
            )}
          </div>
          <div className={Classes.DIALOG_FOOTER}>
            {!!this.state.error && <p className="text-danger">{this.state.error}</p>}
            <div className={Classes.DIALOG_FOOTER_ACTIONS}>
              <Button
                id="btn-modal-create-bot"
                type="submit"
                text={this.state.isProcessing ? 'Please wait...' : 'Create Bot'}
                onClick={this.createBot}
                disabled={this.isButtonDisabled}
                intent={Intent.PRIMARY}
              />
            </div>
          </div>
        </form>
      </Dialog>
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

export default connect<StateProps, DispatchProps, OwnProps>(mapStateToProps, mapDispatchToProps)(CreateBotModal)
