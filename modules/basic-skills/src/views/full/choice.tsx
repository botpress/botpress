import { Checkbox, FormGroup, InputGroup, NumericInput, TagInput } from '@blueprintjs/core'
// @ts-ignore
import ContentPickerWidget from 'botpress/content-picker'
import _ from 'lodash'
import React from 'react'
import { Alert, Tab, Tabs } from 'react-bootstrap'
import { Input, Label } from 'reactstrap'

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
}

interface State {
  keywords: any
  contentId: string
  invalidContentId: string
  config: ChoiceConfig
  defaultConfig: any
}

export class Choice extends React.Component<SkillProps<ChoiceData> & { bp: any }, State> {
  private choices: any

  state: State = {
    keywords: {},
    contentId: '',
    invalidContentId: '',
    config: {
      nbMaxRetries: 10,
      repeatChoicesOnInvalid: false,
      contentElement: undefined
    },
    defaultConfig: undefined
  }

  async componentDidMount() {
    this.props.resizeBuilderWindow && this.props.resizeBuilderWindow('small')
    const getOrDefault = (propsKey, stateKey) => this.props.initialData[propsKey] || this.state[stateKey]

    await this.fetchDefaultConfig().then(({ data }) => {
      if (this.props.initialData) {
        this.setState(
          {
            contentId: getOrDefault('contentId', 'contentId'),
            invalidContentId: getOrDefault('invalidContentId', 'invalidContentId'),
            keywords: getOrDefault('keywords', 'keywords'),
            config: { nbMaxRetries: data.defaultMaxAttempts, ...getOrDefault('config', 'config') },
            defaultConfig: data
          },
          () => this.refreshContent()
        )
      }
    })
  }

  async refreshContent() {
    const id = this.state.contentId

    if (id && id.length) {
      const res = await this.props.bp.axios.get(`/content/element/${id}`)
      return this.onContentChanged(res.data, true)
    }
  }

  componentDidUpdate() {
    this.updateParent()
  }

  updateParent = () => {
    this.props.onDataChanged &&
      this.props.onDataChanged({
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
          acc[v.value] = _.uniq([v.value, v.title])
        }
        return acc
      }, initialKeywords)
      this.setState({ contentId: element.id, keywords: keywords })
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
          <h4>
            {choice.title} <small>({choice.value})</small>
          </h4>
          <TagInput
            onChange={this.handleTagChange(choice.value)}
            placeholder="Separate values with commas..."
            values={keywordsEntry}
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
        <Alert bsStyle="warning">No choices available. Pick a content element that contains choices.</Alert>
      )

    const contentPickerProps: any = {}
    const contentType = this.getContentType()
    if (contentType && contentType.length) {
      contentPickerProps.categoryId = contentType
    }

    return (
      <div style={{ padding: 10 }}>
        <h4>Change the question and choices</h4>

        <div style={{ padding: 10 }}>
          <ContentPickerWidget
            {...contentPickerProps}
            refresh={() => this.refreshContent()}
            contentType={this.getContentType()}
            itemId={this.state.contentId}
            onChange={this.onContentChanged}
            placeholder="Pick content (question and choices)"
          />
        </div>

        <h4>Define how choices are matched</h4>

        <div style={{ padding: 10 }}>{matchingSection}</div>
      </div>
    )
  }

  getContentType() {
    // FIXME: defaultContentElement should really be defaultContentType in the config
    return typeof this.state.config.contentElement === 'string'
      ? this.state.config.contentElement
      : this.state.defaultConfig && this.state.defaultConfig.defaultContentElement
  }

  getNbRetries() {
    return (
      this.state.config.nbMaxRetries || (this.state.defaultConfig && this.state.defaultConfig.defaultMaxAttempts) || 0
    )
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
      <div style={{ padding: 10 }}>
        <FormGroup label="Max number of retries">
          <NumericInput
            id="inputMaxRetries"
            min={0}
            max={10}
            onValueChange={this.onMaxRetriesChanged}
            value={this.getNbRetries()}
          />
        </FormGroup>

        <FormGroup label="On invalid choice, say this before repeating question:">
          <ContentPickerWidget
            id="invalidContent"
            name="invalidContent"
            itemId={this.state.invalidContentId}
            onChange={this.handleInvalidContentChange}
            placeholder="Pick a reply"
          />
        </FormGroup>

        <Checkbox
          label="Repeat choices on invalid?"
          checked={this.state.config.repeatChoicesOnInvalid}
          onChange={this.onToggleRepeatChoicesOnInvalid}
        />

        <div>
          <Label htmlFor="contentElementType">Default choice content type:</Label>
          <Input
            id="contentElementType"
            type="text"
            style={{ marginLeft: '5px' }}
            value={this.getContentType()}
            onChange={this.handleConfigTextChanged('contentElement')}
          />
        </div>
      </div>
    )
  }

  render() {
    return (
      <Tabs defaultActiveKey={1} id="add-option-skill-tabs" animation={false}>
        <Tab eventKey={1} title="Basic">
          {this.renderBasic()}
        </Tab>
        <Tab eventKey={2} title="Advanced">
          {this.renderAdvanced()}
        </Tab>
      </Tabs>
    )
  }
}
