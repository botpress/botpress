import React, {Component} from 'react'
import {Button, FormGroup, FormControl, ControlLabel, HelpBlock} from 'react-bootstrap'
import classnames from 'classnames'

import styles from './style.scss'
import {login} from '~/util/Auth'

export default class LoginPage extends Component {
  static contextTypes = {
    router: React.PropTypes.object
  }

  constructor(props, context) {
    super(props, context)
    this.state = {
      user: 'admin',
      password: '',
      error: null,
      loading: false
    }
  }

  renderGlobalStyle() {
    return <style>
      {
        "\ body{\ background-color: #e4eaec;\ }\ "
      }</style>
  }

  handlePasswordChange(event) {
    this.setState({password: event.target.value})
  }

  handleSubmit(event) {
    event.preventDefault()
    this.setState({loading: true})

    login(this.state.user, this.state.password)
    .then((result) => {
      this.setState({error: null})
      this.context.router.push(this.props.location.query.returnTo || '/')
    }).catch((err) => {
      this.setState({error: err.message, loading: false})
    })
  }

  renderLoading() {
    const className = classnames(styles.loading, 'bp-loading')
    return this.state.loading && <div className={className}>
      <div style={{
        marginTop: '140px'
      }} className="whirl helicopter"></div>
    </div>
  }

  render() {
    const panelStyle = classnames('panel', 'bp-login', styles['panel-center'], {
      [styles['panel-center-tall']]: !!this.state.error
    })
    const headerStyle = classnames('panel-heading', 'text-center', styles.header, 'bp-header')
    const errorStyle = classnames(styles.error)

    return <div>{this.renderGlobalStyle()}
      <div className="block-center mt-xl wd-xl">
        <div className={panelStyle}>
          <div className={headerStyle}>
            <h4>Login</h4>
          </div>
          <div className="panel-body">
            {this.renderLoading()}
            {this.state.error && <p className={errorStyle}>{this.state.error}</p>}
            <form onSubmit={this.handleSubmit.bind(this)}>
              <FormGroup>
                <ControlLabel>User</ControlLabel>
                <FormControl type="text" placeholder="" value="admin" readOnly/>
              </FormGroup>
              <FormGroup>
                <ControlLabel>Password</ControlLabel>
                <FormControl type="password" placeholder="" value={this.state.password} onChange={this.handlePasswordChange.bind(this)}/>
              </FormGroup>
              <Button className="pull-right" type="submit">Login</Button>
            </form>
          </div>
        </div>
      </div>
    </div>
  }
}
