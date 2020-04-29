import React from 'react'
import { Button } from 'react-bootstrap'
import axios from 'axios'
import find from 'lodash/find'
import includes from 'lodash/includes'
import Loader from 'react-loaders'
import withLanguage from '../../../components/Util/withLanguage'
import { connect } from 'react-redux'

import { cancelNewSkill, insertNewSkill, updateSkill } from '~/actions'
const style = require('./style.scss')

const VALID_WINDOW_SIZES = ['normal', 'large', 'small']

import InjectedModuleView from '~/components/PluginInjectionSite/module'
import { lang, Dialog } from 'botpress/shared'

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
    this.setState({
      ...this.resetState(),
      moduleProps: this.buildModuleProps(this.props.data)
    })
  }

  UNSAFE_componentWillReceiveProps(nextProps) {
    if (nextProps.skillId !== this.props.skillId || nextProps.opened !== this.props.opened) {
      this.setState({
        ...this.resetState(),
        moduleProps: this.buildModuleProps(nextProps.data)
      })
    }
  }

  renderModuleNotFound = () => {
    return <div>{lang.tr('studio.flow.skills.couldNotLoad')}</div>
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
          transitions: generated.transitions,
          location: this.props.location
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
        <h2>{lang.tr('studio.flow.skills.generatingSkillFlow')}</h2>
        <Loader type="ball-pulse" color="#26A65B" style={{ margin: '4px' }} />
      </div>
    )
  }

  onWindowResized = size => {
    if (!includes(VALID_WINDOW_SIZES, size)) {
      const sizes = VALID_WINDOW_SIZES.join(', ')
      return console.log(
        lang.tr('studio.flow.skills.error', {
          size,
          sizes
        })
      )
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
    const submitName = this.props.action === 'new' ? lang.tr('insert') : lang.tr('save')
    const title =
      this.props.action === 'new' ? lang.tr('studio.flow.skills.insert') : lang.tr('studio.flow.skills.edit')

    return (
      <Dialog.Wrapper
        title={`${title} | ${lang.tr(skill && skill.name)}`}
        size="lg"
        className={modalClassName}
        isOpen={this.props.opened}
        onClose={this.onCancel}
      >
        <Dialog.Body>
          {this.renderLoading()}
          {!this.state.loading && (
            <WrappedInjectedModule
              moduleName={skill && skill.moduleName}
              componentName={skill && skill.id}
              onNotFound={this.renderModuleNotFound}
              extraProps={this.state.moduleProps}
            />
          )}
        </Dialog.Body>
        <Dialog.Footer>
          <Button onClick={this.onCancel}>{lang.tr('cancel')}</Button>
          <Button onClick={this.onSubmit} disabled={!this.state.canSubmit} bsStyle="primary">
            {submitName}
          </Button>
        </Dialog.Footer>
      </Dialog.Wrapper>
    )
  }
}

const mapStateToProps = state => ({
  installedSkills: state.skills.installed,
  ...state.skills.builder
})

const mapDispatchToProps = {
  cancelNewSkill,
  insertNewSkill,
  updateSkill
}

export default connect(mapStateToProps, mapDispatchToProps)(withLanguage(SkillsBuilder))
