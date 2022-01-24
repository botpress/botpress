import {
  Callout,
  Checkbox,
  FormGroup,
  H5,
  H6,
  InputGroup,
  Intent,
  NumericInput,
  Tab,
  Tabs,
  TagInput
} from '@blueprintjs/core'
// @ts-ignore
import ContentPickerWidget from 'botpress/content-picker'
import _ from 'lodash'
import { customAlphabet } from 'nanoid'
import React from 'react'

import style from './style.scss'
import { SkillProps } from './typings'

const MAX_RETRIES = 10

interface ChoiceData {
  contentId: string
  invalidContentId: string
  keywords: any
  config: ChoiceConfig
  randomId?: string
}

interface ChoiceConfig {
  nbMaxRetries: number
  repeatChoicesOnInvalid: boolean
  contentElement: string
  variableName: string
}

interface State {
  tab: any
  keywords: any
  randomId: string
  contentId: string
  invalidContentId: string
  config: ChoiceConfig
  defaultConfig: any
}

export class Choice extends React.Component<SkillProps<ChoiceData> & { bp: any }, State> {
  private choices: any

  state: State = {
    tab: 'basic',
    keywords: {},
    randomId: customAlphabet('abcdefghijklmnopqrstuvwxyz0123456789', 10)(),
    contentId: '',
    invalidContentId: '',
    config: {
      nbMaxRetries: 3,
      repeatChoicesOnInvalid: false,
      contentElement: undefined,
      variableName: ''
    },
    defaultConfig: undefined
  }

  async componentDidMount() {
    this.props.resizeBuilderWindow && this.props.resizeBuilderWindow('small')
    const getOrDefault = (propsKey, stateKey) => this.props.initialData[propsKey] || this.state[stateKey]

    if (this.props.initialData) {
      const { data } = await this.fetchDefaultConfig()
      this.setState(
        {
          randomId: getOrDefault('randomId', 'randomId'),
          contentId: getOrDefault('contentId', 'contentId'),
          invalidContentId: getOrDefault('invalidContentId', 'invalidContentId'),
          keywords: getOrDefault('keywords', 'keywords'),
          config: { nbMaxRetries: data.defaultMaxAttempts, ...getOrDefault('config', 'config') },
          defaultConfig: data
        },
        () => this.refreshContent()
      )
    }
  }

  async refreshContent() {
    const id = this.state.contentId

    if (id && id.length) {
      const res = await this.props.bp.axios.get(`/cms/element/${id}`, { baseURL: window['STUDIO_API_PATH'] })
      return this.onContentChanged(res.data, true)
    }
  }

  componentDidUpdate(prevProps, prevState) {
    if (this.state !== prevState) {
      this.updateParent()
    }
  }

  updateParent = () => {
    this.props.onDataChanged &&
      this.props.onDataChanged({
        randomId: this.state.randomId,
        contentId: this.state.contentId,
        invalidContentId: this.state.invalidContentId,
        keywords: this.state.keywords,
        config: this.state.config
      })
    if (this.choices && this.choices.length > 0) {
      this.props.onValidChanged && this.props.onValidChanged(true)
    }
  }

  fetchDefaultConfig = async () => {
    return this.props.bp.axios.get('/mod/basic-skills/choice/config')
  }

  onMaxRetriesChanged = value => {
    const config = {
      ...this.state.config,
      nbMaxRetries: isNaN(Number(value)) ? MAX_RETRIES : Number(value)
    }
    this.setState({ config })
  }

  onToggleRepeatChoicesOnInvalid = event => {
    this.setState({
      config: { ...this.state.config, repeatChoicesOnInvalid: !this.state.config.repeatChoicesOnInvalid }
    })
  }

  onBlocNameChanged = key => event => {
    let blocName = event.target.value

    if (!blocName.startsWith('#')) {
      blocName = '#' + blocName
    }

    // @ts-ignore
    this.setState({ [key]: blocName })
  }

  onNameOfQuestionBlocChanged = this.onBlocNameChanged('nameOfQuestionBloc')
  onNameOfInvalidBlocChanged = this.onBlocNameChanged('nameOfInvalidBloc')

  onContentChanged = (element, force = false) => {
    if (element && (force || element.id !== this.state.contentId)) {
      this.choices = _.get(element, 'formData.choices$' + this.props.contentLang) || []
      const initialKeywords = element.id === this.state.contentId ? this.state.keywords : {}
      const keywords = this.choices.reduce((acc, v) => {
        if (!acc[v.value]) {
          acc[v.value] = initialKeywords[v.value] ? initialKeywords[v.value] : _.uniq([v.value, v.title])
        }
        return acc
      }, {})
      this.setState({ contentId: element.id, keywords })
    }
  }

  handleTagChange = choiceValue => keywords => {
    this.setState({ keywords: { ...this.state.keywords, [choiceValue]: keywords } })
  }

  renderMatchingSection() {
    return this.choices.map(choice => {
      const keywordsEntry = this.state.keywords[choice.value] || []

      return (
        <div className={style.keywords} key={choice.title}>
          <H6>
            {choice.title} <small>({choice.value})</small>
          </H6>
          <TagInput
            onChange={this.handleTagChange(choice.value)}
            placeholder="Separate values with commas..."
            values={keywordsEntry}
            tagProps={{ minimal: true }}
          />
        </div>
      )
    })
  }

  renderBasic() {
    const matchingSection =
      this.choices && this.choices.length ? (
        this.renderMatchingSection()
      ) : (
        <Callout intent={Intent.DANGER}>No choices available. Pick a content element that contains choices.</Callout>
      )

    const contentPickerProps: any = {}
    const contentType = this.getContentType()
    if (contentType && contentType.length) {
      contentPickerProps.categoryId = contentType
    }

    return (
      <div>
        <H5>Change the question and choices</H5>

        <div className={style.padded}>
          <ContentPickerWidget
            {...contentPickerProps}
            refresh={() => this.refreshContent()}
            contentType={this.getContentType()}
            itemId={this.state.contentId}
            onChange={this.onContentChanged}
            placeholder="Pick content (question and choices)"
          />
        </div>

        <H5>Define how choices are matched</H5>

        <div className={style.padded}>{matchingSection}</div>
      </div>
    )
  }

  getContentType() {
    // FIXME: defaultContentElement should really be defaultContentType in the config
    return typeof this.state.config.contentElement === 'string'
      ? this.state.config.contentElement
      : this.state.defaultConfig && this.state.defaultConfig.defaultContentElement
  }

  getVariableName() {
    const { variableName } = this.state.config
    return variableName ? variableName : ''
  }

  handleBlurVariableName() {
    const { variableName } = this.state.config
    const config = {
      ...this.state.config,
      variableName: variableName && variableName.length ? variableName : this.state.randomId
    }
    this.setState({ config })
  }

  getNbRetries() {
    if (this.state.config.nbMaxRetries !== undefined || this.state.config.nbMaxRetries !== null) {
      return this.state.config.nbMaxRetries
    }

    return (this.state.defaultConfig && this.state.defaultConfig.defaultMaxAttempts) || 0
  }

  handleConfigTextChanged = name => event => {
    const config = { ...this.state.config, [name]: event.target.value }
    this.setState({ config })
  }

  handleInvalidContentChange = content => {
    this.setState({ invalidContentId: content.id })
  }

  renderAdvanced() {
    return (
      <div>
        <FormGroup label="Max number of retries">
          <NumericInput
            id="inputMaxRetries"
            min={0}
            max={10}
            onValueChange={this.onMaxRetriesChanged}
            value={this.getNbRetries()}
          />
        </FormGroup>

        <FormGroup label="Variable Name">
          <InputGroup
            id="variableName"
            value={this.getVariableName()}
            onChange={this.handleConfigTextChanged('variableName')}
            onBlur={this.handleBlurVariableName.bind(this)}
          />
        </FormGroup>

        <Checkbox
          label="Repeat choices on invalid choice"
          checked={this.state.config.repeatChoicesOnInvalid}
          onChange={this.onToggleRepeatChoicesOnInvalid}
        />

        <FormGroup label="On invalid choice, say this before repeating question:">
          <ContentPickerWidget
            id="invalidContent"
            name="invalidContent"
            itemId={this.state.invalidContentId}
            onChange={this.handleInvalidContentChange}
            placeholder="Pick a reply"
          />
        </FormGroup>

        <FormGroup label="Default choice content type">
          <InputGroup
            id="contentElementType"
            value={this.getContentType()}
            onChange={this.handleConfigTextChanged('contentElement')}
          />
        </FormGroup>
      </div>
    )
  }

  render() {
    return (
      <Tabs id="add-option-skill-tabs" onChange={tab => this.setState({ tab })}>
        <Tab id="basic" title="Basic" panel={this.renderBasic()} />
        <Tab id="advanced" title="Advanced" panel={this.renderAdvanced()} />
      </Tabs>
    )
  }
}
