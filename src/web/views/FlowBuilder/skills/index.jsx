import React from 'react'
import { Modal, Button, Alert } from 'react-bootstrap'
import classnames from 'classnames'
import find from 'lodash/find'
import Loader from 'halogen/BounceLoader'

const style = require('./style.scss')

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
    loading: false
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
    console.log('Skill data changed', data) // TODO Remove this
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

  buildModuleProps = data => ({
    initialData: data,
    onDataChanged: this.onDataChanged,
    onValidChanged: this.onValidChanged
  })

  render() {
    const show = this.props.opened
    const onCancel = () => this.props.cancelNewSkill()
    const onHide = onCancel

    // Size of modal
    // __

    const skill = find(this.props.installedSkills, { id: this.props.skillId })

    const onSubmit = () =>
      this.setState({
        loading: true,
        canSubmit: false
      })

    return (
      <Modal animation={false} show={show} onHide={onHide} backdrop="static">
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
          <Button onClick={onCancel}>Cancel</Button>
          <Button onClick={onSubmit} disabled={!this.state.canSubmit} bsStyle="primary">
            Insert
          </Button>
        </Modal.Footer>
      </Modal>
    )
  }
}
