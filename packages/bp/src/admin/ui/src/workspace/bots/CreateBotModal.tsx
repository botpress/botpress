import { Button, Classes, Dialog, FormGroup, InputGroup, Intent, Callout } from '@blueprintjs/core'
import { BotConfig, BotTemplate } from 'botpress/sdk'
import { lang } from 'botpress/shared'
import _ from 'lodash'
import React, { Component } from 'react'
import { connect, ConnectedProps } from 'react-redux'
import Select from 'react-select'

import api from '~/app/api'
import { AppState } from '~/app/rootReducer'
import { getActiveWorkspace } from '~/auth/basicAuth'
import { fetchBotCategories, fetchBotTemplates } from './reducer'

export const sanitizeBotId = (text: string) =>
  text
    .toLowerCase()
    .replace(/\s/g, '-')
    .replace(/[^a-z0-9_-]/g, '')

interface SelectOption<T> {
  label: string
  value: T
  __isNew__?: boolean
}

type Props = {
  isOpen: boolean
  existingBots: BotConfig[]
  onCreateBotSuccess: () => void
  toggle: () => void
  currentWorkspaceID: string | undefined
} & ConnectedProps<typeof connector>

const makeBotId = (workspace: string, botName: string) => `${workspace}_${sanitizeBotId(botName)}`

interface State {
  botId: string
  botName: string
  isProcessing: boolean

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
  isProcessing: false
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
    if (!this.props.currentWorkspaceID) {
      return
    }
    const botName = e.target.value
    const botId = makeBotId(this.props.currentWorkspaceID, botName)
    this.setState({ botName, botId })
  }

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
      await api.getSecured().post('/admin/workspace/bots', newBot)
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
    const isNameOrIdInvalid =
      !botId ||
      !botName ||
      (this.props.existingBots && this.props.existingBots.some(bot => bot.name === botName || bot.id === botId))
    return isNameOrIdInvalid || isProcessing || !selectedTemplate || !this._form || !this._form.checkValidity()
  }

  render() {
    return (
      <Dialog
        title={lang.tr('admin.workspace.bots.create.newBot')}
        icon="add"
        isOpen={this.props.isOpen}
        onClose={this.toggleDialog}
        transitionDuration={0}
        canOutsideClickClose={false}
      >
        <form ref={form => (this._form = form)}>
          <div className={Classes.DIALOG_BODY}>
            <FormGroup
              label={lang.tr('admin.workspace.bots.create.name')}
              labelFor="bot-name"
              labelInfo="*"
              helperText={lang.tr('admin.workspace.bots.create.nameHelper')}
            >
              <InputGroup
                id="input-bot-name"
                tabIndex={1}
                placeholder={lang.tr('admin.workspace.bots.create.namePlaceholder')}
                minLength={3}
                required
                value={this.state.botName}
                onChange={this.handleNameChanged}
                autoFocus
              />
            </FormGroup>

            <FormGroup
              label={lang.tr('admin.workspace.bots.create.id')}
              labelFor="botid"
              helperText={lang.tr('admin.workspace.bots.create.idHelper')}
            >
              <InputGroup
                id="botid"
                tabIndex={2}
                placeholder={lang.tr('admin.workspace.bots.create.idPlaceholder')}
                minLength={3}
                required
                value={this.state.botId}
                disabled
              />
            </FormGroup>

            {this.state.templates.length > 0 && (
              <FormGroup label={lang.tr('admin.workspace.bots.create.template')} labelFor="template">
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
              <FormGroup label={lang.tr('admin.workspace.bots.create.category')}>
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
            {!!this.state.error && <Callout intent={Intent.DANGER}>{this.state.error}</Callout>}
            <div className={Classes.DIALOG_FOOTER_ACTIONS}>
              <Button
                id="btn-modal-create-bot"
                type="submit"
                text={this.state.isProcessing ? lang.tr('pleaseWait') : lang.tr('admin.workspace.bots.create.create')}
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

const mapStateToProps = (state: AppState) => state.bots
const connector = connect(mapStateToProps, { fetchBotTemplates, fetchBotCategories })

export default connector(CreateBotModal)
