import React from 'react'
import { Modal, Button, Alert } from 'react-bootstrap'
import classnames from 'classnames'
import find from 'lodash/find'

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
    canSubmit: false
  }

  componentDidMount() {
    this.setState({ initialData: this.props.data })
  }

  componentWillReceiveProps(nextProps) {
    if (nextProps.skillId !== this.props.skillId) {
      this.setState({
        moduleProps: this.buildModuleProps(nextProps.data),
        canSubmit: false
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

    const onSubmit = () => false
    let canSubmit = false

    console.log('---->', this.props)

    return (
      <Modal animation={false} show={show} onHide={onHide} backdrop="static">
        <Modal.Header closeButton>
          <Modal.Title>Insert a new skill | {skill && skill.name}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <WrappedInjectedModule
            moduleName={skill && skill.id}
            onNotFound={this.renderModuleNotFound}
            extraProps={this.state.moduleProps}
          />
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
