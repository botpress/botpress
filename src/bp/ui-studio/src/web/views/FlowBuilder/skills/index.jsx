import React from 'react'
import { Modal, Button } from 'react-bootstrap'
import axios from 'axios'
import find from 'lodash/find'
import includes from 'lodash/includes'
import Loader from 'react-loaders'
import withLanguage from '../../../components/Util/withLanguage'

const style = require('./style.scss')

const VALID_WINDOW_SIZES = ['normal', 'large', 'small']

import InjectedModuleView from '~/components/PluginInjectionSite/module'

class WrappedInjectedModule extends React.Component {
  shouldComponentUpdate(nextProps) {
    return nextProps.moduleProps !== this.props.moduleProps || nextProps.moduleName !== this.props.moduleName
  }

  render() {
    return <InjectedModuleView {...this.props} />
  }
}

class SkillsBuilder extends React.Component {
  resetState = () => ({
    moduleProps: {},
    canSubmit: false,
    loading: false,
    windowSize: 'normal'
  })

  state = this.resetState()

  componentDidMount() {
    this.setState({ initialData: this.props.data })
  }

  componentDidMount() {
    this.setState({
      ...this.resetState(),
      moduleProps: this.buildModuleProps(this.props.data)
    })
  }

  componentWillReceiveProps(nextProps) {
    if (nextProps.skillId !== this.props.skillId || nextProps.opened !== this.props.opened) {
      this.setState({
        ...this.resetState(),
        moduleProps: this.buildModuleProps(nextProps.data)
      })
    }
  }

  renderModuleNotFound = () => {
    return <div>Could not load skill&apos;s view</div>
  }

  onDataChanged = data => {
    this.data = data
  }

  onSubmit = () => {
    this.setState({
      loading: true,
      canSubmit: false
    })

    return this.generateFlow().then(generated => {
      if (this.props.action === 'edit') {
        this.props.updateSkill({
          skillId: this.props.skillId,
          data: this.data,
          generatedFlow: generated.flow,
          transitions: generated.transitions,
          editFlowName: this.props.editFlowName,
          editNodeId: this.props.editNodeId
        })
      } else {
        this.props.insertNewSkill({
          skillId: this.props.skillId,
          data: this.data,
          generatedFlow: generated.flow,
          transitions: generated.transitions
        })
      }
    })
  }

  onCancel = () => {
    this.props.cancelNewSkill()
  }

  onValidChanged = valid => {
    this.setState({ canSubmit: valid })
  }

  renderLoading = () => {
    if (!this.state.loading) {
      return null
    }

    return (
      <div className={style.loadingContainer}>
        <h2>Generating your skill flow...</h2>
        <Loader type="ball-pulse" color="#26A65B" style={{ margin: '4px' }} />
      </div>
    )
  }

  onWindowResized = size => {
    if (!includes(VALID_WINDOW_SIZES, size)) {
      const sizes = VALID_WINDOW_SIZES.join(', ')
      return console.log(`ERROR – Skill "${size}" is an invalid size for Skill window. Valid sizes are ${sizes}.`)
    }

    this.setState({
      windowSize: size
    })
  }

  buildModuleProps = data => ({
    initialData: data,
    onDataChanged: this.onDataChanged,
    onValidChanged: this.onValidChanged,
    resizeBuilderWindow: this.onWindowResized,
    contentLang: this.props.contentLang,
    languages: this.props.languages,
    defaultLanguage: this.props.defaultLanguage
  })

  generateFlow = () => {
    const skill = find(this.props.installedSkills, { id: this.props.skillId })

    return axios
      .post(
        `${window.API_PATH}/modules/${skill.moduleName}/skill/${skill.id}/generateFlow?botId=${window.BOT_ID}`,
        this.data
      )
      .then(({ data }) => data)
  }

  findInstalledSkill() {
    const skillId = this.props.skillId
    if (!skillId) {
      return
    }

    return find(this.props.installedSkills, x => x.id.toLowerCase() === skillId.toLowerCase())
  }

  render() {
    const skill = this.findInstalledSkill()
    const modalClassName = style['size-' + this.state.windowSize]
    const submitName = this.props.action === 'new' ? 'Insert' : 'Save'

    return (
      <Modal
        dialogClassName={modalClassName}
        animation={false}
        show={this.props.opened}
        onHide={this.onCancel}
        backdrop="static"
      >
        <Modal.Header closeButton>
          <Modal.Title>Insert a new skill | {skill && skill.name}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {this.renderLoading()}
          {!this.state.loading && (
            <WrappedInjectedModule
              moduleName={skill && skill.moduleName}
              componentName={skill && skill.id}
              onNotFound={this.renderModuleNotFound}
              extraProps={this.state.moduleProps}
            />
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button onClick={this.onCancel}>Cancel</Button>
          <Button onClick={this.onSubmit} disabled={!this.state.canSubmit} bsStyle="primary">
            {submitName}
          </Button>
        </Modal.Footer>
      </Modal>
    )
  }
}

export default withLanguage(SkillsBuilder)
