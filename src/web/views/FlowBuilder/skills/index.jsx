import React from 'react'
import { Modal, Button, Alert } from 'react-bootstrap'
import classnames from 'classnames'
import find from 'lodash/find'

import InjectedModuleView from '~/components/PluginInjectionSite/module'

export default class SkillsBuilder extends React.Component {
  renderModuleNotFound() {
    return 'Error'
  }

  render() {
    const show = this.props.opened
    const onCancel = () => this.props.cancelNewSkill()
    const onHide = onCancel

    // Size of modal
    // __

    const skill = find(this.props.installedSkills, { id: this.props.skillId })

    const onSubmit = () => false
    const canSubmit = true

    console.log('---->', this.props)

    return (
      <Modal animation={false} show={show} onHide={onHide} backdrop="static">
        <Modal.Header closeButton>
          <Modal.Title>Insert a new skill | {skill && skill.name}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <InjectedModuleView moduleName={skill && skill.id} onNotFound={this.renderModuleNotFound} />
        </Modal.Body>
        <Modal.Footer>
          <Button onClick={onCancel}>Cancel</Button>
          <Button onClick={onSubmit} bsStyle="primary">
            Insert
          </Button>
        </Modal.Footer>
      </Modal>
    )
  }
}
