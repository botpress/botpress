import React from 'react'
import _ from 'lodash'

import { Alert, Tabs, Tab } from 'react-bootstrap'
import { Label, Input } from 'reactstrap'
import { WithContext as ReactTags } from 'react-tag-input'
import ContentPickerWidget from 'botpress/content-picker'

import style from './style.scss'

const MAX_RETRIES = 10

export class Choice extends React.Component {
  state = {
    keywords: {},
    contentId: '',
    invalidContentId: '',
    config: {}
  }

  componentDidMount() {
    this.props.resizeBuilderWindow && this.props.resizeBuilderWindow('small')
    const getOrDefault = (propsKey, stateKey) => this.props.initialData[propsKey] || this.state[stateKey]

    this.fetchDefaultConfig().then(({ data }) => {
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

  onMaxRetriesChanged = event => {
    const config = {
      ...this.state.config,
      nbMaxRetries: isNaN(Number(event.target.value)) ? MAX_RETRIES : Number(event.target.value)
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

  handleMatchAddition = choiceValue => tag => {
    const newTags = [...(this.state.keywords[choiceValue] || []), tag.text]
    const keywords = { ...this.state.keywords, [choiceValue]: newTags }
    this.setState({ keywords: keywords })
  }

  handleMatchDeletion = choiceValue => index => {
    const newTags = this.state.keywords[choiceValue] || []
    _.pullAt(newTags, index)
    const keywords = { ...this.state.keywords, [choiceValue]: newTags }
    this.setState({ keywords: keywords })
  }

  renderMatchingSection() {
    return this.choices.map(choice => {
      const keywordsEntry = this.state.keywords[choice.value] || []
      const tags = keywordsEntry.map(x => ({ id: x, text: x }))
      return (
        <div className={style.keywords} key={choice.title}>
          <h4>
            {choice.title} <small>({choice.value})</small>
          </h4>
          <ReactTags
            inline
            tags={tags}
            suggestions={[]}
            handleDelete={this.handleMatchDeletion(choice.value)}
            handleAddition={this.handleMatchAddition(choice.value)}
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

    const contentPickerProps = {}
    const contentType = this.getContentType()
    if (contentType && contentType.length) {
      contentPickerProps.categoryId = contentType
    }

    return (
      <div className={style.content}>
        <p>
          <strong>Change the question and choices</strong>
        </p>
        <div>
          <ContentPickerWidget
            {...contentPickerProps}
            refresh={() => this.refreshContent()}
            contentType={this.getContentType()}
            itemId={this.state.contentId}
            onChange={this.onContentChanged}
            placeholder="Pick content (question and choices)"
          />
        </div>
        <p>
          <strong>Define how choices are matched</strong>
        </p>
        <div>{matchingSection}</div>
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

  getInvalidText() {
    return this.state.config.invalidText || ''
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
      <div className={style.content}>
        <div>
          <Label htmlFor="inputMaxRetries">Max number of retries:</Label>
          <Input
            id="inputMaxRetries"
            type="number"
            name="quantity"
            min="0"
            max="10"
            value={this.getNbRetries()}
            onChange={this.onMaxRetriesChanged}
          />
        </div>

        <div>
          <Label htmlFor="invalidText">On invalid choice, say this before repeating question:</Label>
          <ContentPickerWidget
            id="invalidContent"
            name="invalidContent"
            itemId={this.state.invalidContentId}
            onChange={this.handleInvalidContentChange}
            placeholder="Pick a reply"
          />
          <Label htmlFor="repeatChoices">Repeat choices on invalid?</Label>
          <input
            id="repeatChoices"
            type="checkbox"
            checked={this.state.config.repeatChoicesOnInvalid}
            onChange={this.onToggleRepeatChoicesOnInvalid}
          />
        </div>

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
