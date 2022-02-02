import { Button, Classes, Dialog, FormGroup, InputGroup, Intent, Callout, Checkbox } from '@blueprintjs/core'
import { BotConfig, BotTemplate } from 'botpress/sdk'
import { lang } from 'botpress/shared'
import { defaultOauthUrl } from 'common/defaults'
import _ from 'lodash'
import ms from 'ms'
import React, { Component } from 'react'
import { connect, ConnectedProps } from 'react-redux'
import Select from 'react-select'

import api from '~/app/api'
import { AppState } from '~/app/rootReducer'
import { fetchBotCategories, fetchBotTemplates } from './reducer'
import style from './style.scss'

export const sanitizeBotId = (text: string) =>
  text
    .toLowerCase()
    .replace(/\s/g, '-')
    .replace(/[^a-z0-9_-]/g, '')
    .substring(0, 50)

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
} & ConnectedProps<typeof connector>

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

  isCloudBot: boolean
  cloudClientId: string
  cloudClientSecret: string
}

const defaultState: Omit<State, 'templates' | 'categories'> = {
  botId: '',
  botName: '',
  selectedCategory: undefined,
  selectedTemplate: undefined,
  error: undefined,
  isProcessing: false,
  generateId: true,
  isCloudBot: false,
  cloudClientId: '',
  cloudClientSecret: ''
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

  componentDidUpdate(prevProps: Props, prevState: State) {
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
    if (!this.isFormValid()) {
      return
    }
    this.setState({ isProcessing: true })

    const newBot: Partial<BotConfig> & { template: Partial<BotTemplate> } = {
      id: this.state.botId,
      name: this.state.botName,
      template: _.pick(this.state.selectedTemplate, ['id', 'moduleId']),
      category: this.state.selectedCategory && this.state.selectedCategory.value
    }

    if (this.state.isCloudBot) {
      newBot.isCloudBot = this.state.isCloudBot
      newBot.cloud = {
        clientId: this.state.cloudClientId,
        clientSecret: this.state.cloudClientSecret,
        oauthUrl: defaultOauthUrl
      }
    }

    try {
      await api.getSecured({ timeout: ms('2m') }).post('/admin/workspace/bots', newBot)
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

  isFormValid = (): boolean => {
    const { isProcessing, botId, botName, selectedTemplate } = this.state

    const nameAndIdValid =
      !!botId && !!botName && !this.props.existingBots?.some(bot => bot.name === botName || bot.id === botId)

    const validCloudOptions = !this.state.isCloudBot || (!!this.state.cloudClientId && !!this.state.cloudClientSecret)

    return (
      !isProcessing &&
      nameAndIdValid &&
      !!selectedTemplate &&
      validCloudOptions &&
      (this._form?.checkValidity() ?? false)
    )
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
              labelFor="input-bot-name"
              labelInfo="*"
              helperText={lang.tr('admin.workspace.bots.create.nameHelper')}
            >
              <InputGroup
                id="input-bot-name"
                placeholder={lang.tr('admin.workspace.bots.create.namePlaceholder')}
                minLength={3}
                maxLength={50}
                required
                value={this.state.botName}
                onChange={this.handleNameChanged}
                autoFocus
              />
            </FormGroup>

            <FormGroup
              label={lang.tr('admin.workspace.bots.create.id')}
              labelFor="botid"
              labelInfo="*"
              helperText={lang.tr('admin.workspace.bots.create.idHelper')}
            >
              <InputGroup
                id="botid"
                placeholder={lang.tr('admin.workspace.bots.create.idPlaceholder')}
                minLength={3}
                maxLength={50}
                required
                value={this.state.botId}
                onChange={this.handleBotIdChanged}
              />
            </FormGroup>

            {this.state.templates.length > 0 && (
              <FormGroup label={lang.tr('admin.workspace.bots.create.template')} labelFor="template">
                <Select
                  id="select-bot-templates"
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
                  options={this.state.categories}
                  value={this.state.selectedCategory}
                  onChange={selectedCategory => this.setState({ selectedCategory: selectedCategory as any })}
                />
              </FormGroup>
            )}
            <FormGroup
              label={lang.tr('admin.workspace.bots.create.cloud')}
              labelFor="checkbox-bot-cloud"
              helperText={lang.tr('admin.workspace.bots.create.cloudHelper')}
            >
              <Checkbox
                id="checkbox-bot-cloud"
                label={lang.tr('admin.workspace.bots.create.cloudCheckbox')}
                checked={this.state.isCloudBot}
                onChange={e => this.setState({ isCloudBot: e.currentTarget.checked })}
              />
            </FormGroup>
            {this.state.isCloudBot && (
              <FormGroup
                label={lang.tr('admin.workspace.bots.create.cloudConfiguration')}
                labelFor="cloud-client-id"
                helperText={lang.tr('admin.workspace.bots.create.cloudConfigurationHelper')}
              >
                <InputGroup
                  id="cloud-client-id"
                  placeholder={lang.tr('admin.workspace.bots.create.clientIdPlaceholder')}
                  value={this.state.cloudClientId}
                  className={style.clientId}
                  onChange={e =>
                    this.setState({
                      cloudClientId: e.target.value
                    })
                  }
                />
                <InputGroup
                  id="cloud-client-secret"
                  placeholder={lang.tr('admin.workspace.bots.create.clientSecretPlaceholder')}
                  value={this.state.cloudClientSecret}
                  type="password"
                  onChange={e =>
                    this.setState({
                      cloudClientSecret: e.target.value
                    })
                  }
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
                disabled={!this.isFormValid()}
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
