import React, { Component } from 'react'
// import { bindActionCreators } from 'redux'
// import { connect } from 'react-redux'

import { CopyToClipboard } from 'react-copy-to-clipboard'
import { Button } from 'reactstrap'
import moment from 'moment'

// import SectionLayout from '../Layouts/Section'
// import LoadingSection from '../Components/LoadingSection'

import api from '../../api'

class Cli extends Component {
  state = { loading: false, token: null, validUntil: null, copied: false }

  componentDidMount() {
    // this.getToken(false)
  }

  async getToken(refresh = false) {
    this.setState({ loading: true })
    const { data } = await api.getSecured().get(`/api/login/cli`, {
      params: {
        refresh
      }
    })

    const payload = data.payload || {}
    this.setState({ loading: false, token: payload.cliToken, validUntil: payload.validUntil })
  }

  onCopy = () => {
    this.setState({ copied: true })
    setTimeout(() => this.setState({ copied: false }), 1000)
  }

  renderToken() {
    const token = 'cli__' + this.state.token
    return (
      <section>
        <p>
          This is your personnal API Token to access the Botpress Cloud via the Botpress CLI or programmatically.{' '}
          <b>Keep this private and do not share it with anybody else.</b>
        </p>
        <pre className="code text-white">{token}</pre>
        <CopyToClipboard text={token} onCopy={this.onCopy}>
          <small>
            <Button disabled={this.state.copied} color="secondary" href="#">
              {this.state.copied ? 'Copied!' : 'Copy to clipboard'}
            </Button>
          </small>
        </CopyToClipboard>
        <hr />
        <p>
          <small>
            This token expires <b>{moment(this.state.validUntil).fromNow()}</b>
          </small>
        </p>
      </section>
    )
  }

  renderSideMenu() {
    return (
      <Button color="primary" outline onClick={() => this.getToken(true)}>
        Regenerate Token
      </Button>
    )
  }

  render() {
    // TODO: find and remove any references to it
    return <h1>You shouldn&apos;t have seen this page</h1>

    // const renderLoading = () => <LoadingSection />

    // const sections = [
    //   { title: 'General', active: false, link: '/me' },
    //   { title: 'API Key', active: true, link: '/me/cli' }
    // ]

    // return (
    //   <SectionLayout
    //     title="API Key"
    //     sections={sections}
    //     mainContent={this.state.loading ? renderLoading() : this.renderToken()}
    //     sideMenu={this.renderSideMenu()}
    //   />
    // )
  }
}

// export default connect(null, mapDispatchToProps)(Cli)

export default Cli
