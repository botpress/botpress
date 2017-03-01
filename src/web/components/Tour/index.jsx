import React from 'react'
import {
  Modal,
  Button,
  Alert
} from 'react-bootstrap'
import classnames from 'classnames'

import emojify from '~/util/Emoji'

import axios from 'axios'
import _ from 'lodash'

import style from './style.scss'

const STEPS_COUNT = 3

export default class GuidedTour extends React.Component {

  constructor(props) {
    super(props)

    this.state = { finished: false, step: 0 }
  }

  handleClose() {
    axios.delete('/api/guided-tour').then(() => {
      this.setState({ finished: true })
    })
  }

  handleNext() {
    if (this.state.step < STEPS_COUNT - 1) {
      this.setState({ step: this.state.step + 1 })
    } else {
      this.handleClose()
    }
  }

  handlePrevious() {
    if (this.state.step > 0) {
      this.setState({ step: this.state.step - 1 })
    }
  }

  renderSkipButton() {
    return <Button className="pull-left" onClick={::this.handleClose}>Skip</Button>
  }

  renderPrevButton() {
    const disabled = this.state.step <= 0
    return <Button disabled={disabled} onClick={::this.handlePrevious}>Back</Button>
  }

  renderNextButton() {
    const buttonText = this.state.step < STEPS_COUNT - 1 ? 'Next' : "Let's start !"
    return <Button onClick={::this.handleNext} bsStyle="success">{buttonText}</Button>
  }

  renderStep_0() {
    return <div>
      <p>{emojify(':tada:', 100)}</p>
      <p className={style.big}>Congratulations on choosing Botpress for your next bot!</p>
      <p>Botpress is the most effective way for developers to create a bot. 
      This very short tour will help you get started quickly.</p>
      <hr />
      <p>First, you should know that a Botpress bot is just a regular Node.js application. 
      There is no black magic, and everything your bot does is done either through code you write or 
      done for you by pre-made modules (thanks to our awesome community).</p>
      <p>By default, your bot's entry point is the <code>index.js</code> file, but you can arrange your code base as you wish. 
      Again, <span className={style.emp}>your bot is just a regular node program.</span></p>
    </div>
  }

  renderStep_1() {
    return <div>
      <p>{emojify(':rocket:', 100)}</p>
      <p className={style.big}>There's a module for that.</p>
      <p>Whenever there's a piece of functionality that you need for your bot, think modules.</p>
      <hr />
      <p>You can install modules via this graphical interface or from the command line interface.</p>
      <p>If there's no module for the generic feature you are looking for, please consider creating one 
      or contributing to an existing module to add that feature. Botpress relies heavily on the community to thrive. 
      Every single contribution is needed, even if it's tiny {emojify(':blush:')}!</p>
      <p>Installing a module from the CLI is as simple as typing <code>botpress install messenger</code></p>
    </div>
  }

  renderStep_2() {
    return <div>
      <p>{emojify(':warning:', 50)}</p>
      <p className={style.big}>Before you deploy your bot...</p>
      <ul className={style.left}>
        <li>We recommend you <a target="_blank" href="#">enable the Postgres database</a> persistence for production environments</li>
        <li>Do <strong>not</strong> store keys, passwords or any sensitive information in your botfile. Use environment variables instead.</li>
        <li>If your bot is not open-source, you must <a target="_blank" href="#">switch to the Botpress License</a>, which is free for bots with <span className={style.emp}>less than 150.000 interactions per month.</span></li>
      </ul>
      <p>Deployment tutorials are <a href="https://docs.botpress.io/deploying.html" target="_blank">available here.</a></p>
    </div>
  }

  renderCurrentStep() {
    let currentStep = Math.min(this.state.step, STEPS_COUNT - 1)
    return this['renderStep_' + currentStep]()
  }

  render() {

    const bodyStyle = classnames("text-center", style.body)

    return (
      <Modal 
        show={!this.state.finished && this.props.opened} 
        onHide={::this.handleClose}
        backdrop='static'>
        <Modal.Header>
          <Modal.Title>Welcome on Botpress !</Modal.Title>
        </Modal.Header>
        <Modal.Body className={bodyStyle}>
          {this.renderCurrentStep()}
        </Modal.Body>
        <Modal.Footer>
          {this.renderSkipButton()}
          {this.renderPrevButton()}
          {this.renderNextButton()}
        </Modal.Footer>
      </Modal>
    )
  }
}
