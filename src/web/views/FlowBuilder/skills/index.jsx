import React from 'react'
import { Modal, Button } from 'react-bootstrap'
import axios from 'axios'
import find from 'lodash/find'
import Loader from 'halogen/BounceLoader'
import _ from 'lodash'

const style = require('./style.scss')

const VALID_WINDOW_SIZES = ['normal', 'large', 'small']

import InjectedModuleView from '~/components/PluginInjectionSite/module'

class WrappedInjectedModule extends React.Component {
  shouldComponentUpdate(nextProps) {
    if (nextProps.moduleProps !== this.props.moduleProps) {
      return true
    }

    if (nextProps.moduleName !== this.props.moduleName) {
      return true
    }

    return false
  }

  render() {
    return <InjectedModuleView {...this.props} />
  }
}

export default class SkillsBuilder extends React.Component {
  state = {
    moduleProps: {},
    canSubmit: false,
    loading: false,
    windowSize: 'normal'
  }

  componentDidMount() {
    this.setState({ initialData: this.props.data })
  }

  componentWillReceiveProps(nextProps) {
    if (nextProps.skillId !== this.props.skillId) {
      this.setState({
        moduleProps: this.buildModuleProps(nextProps.data),
        canSubmit: false,
        loading: false
      })
    }
  }

  renderModuleNotFound = () => {
    return 'Error'
  }

  onDataChanged = data => {
    this.data = data
  }

  onSubmit = () => {
    this.setState({
      loading: true,
      canSubmit: false
    })

    return this.generateFlow().then(() => {
      // this.props.
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
        <Loader color="#26A65B" size="36px" margin="4px" />
      </div>
    )
  }

  onWindowResized = size => {
    if (!_.includes(VALID_WINDOW_SIZES, size)) {
      const sizes = VALID_WINDOW_SIZES.join(', ')
      console.log(`ERROR – Skill "${size}" is an invalid size for Skill window. Valid sizes are ${sizes}.`)
    }

    this.setState({
      windowSize: size
    })
  }

  buildModuleProps = data => ({
    initialData: data,
    onDataChanged: this.onDataChanged,
    onValidChanged: this.onValidChanged,
    resizeBuilderWindow: this.onWindowResized
  })

  generateFlow = () => {
    return axios.post(`/skills/${this.props.skillId}/generate`, this.data)
  }

  render() {
    const show = this.props.opened
    const skill = find(this.props.installedSkills, { id: this.props.skillId })

    const modalClassName = style['modal-size-' + this.state.windowSize]

    console.log(modalClassName)

    return (
      <Modal dialogClassName={modalClassName} animation={false} show={show} onHide={this.onCancel} backdrop="static">
        <Modal.Header closeButton>
          <Modal.Title>Insert a new skill | {skill && skill.name}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {this.renderLoading()}
          {!this.state.loading && (
            <WrappedInjectedModule
              moduleName={skill && skill.id}
              onNotFound={this.renderModuleNotFound}
              extraProps={this.state.moduleProps}
            />
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button onClick={this.onCancel}>Cancel</Button>
          <Button onClick={this.onSubmit} disabled={!this.state.canSubmit} bsStyle="primary">
            Insert
          </Button>
        </Modal.Footer>
      </Modal>
    )
  }
}
