import React from 'react'
import { Container, Button, Alert } from 'reactstrap'
import { connect } from 'react-redux'

import api from '../../api'
import { fetchModules } from '../../reducers/modules'

class Modules extends React.Component {
  state = {}

  componentDidMount() {
    this.props.fetchModules()
  }

  reloadModule = async moduleName => {
    try {
      await api.getSecured().get(`/modules/reload/${moduleName}`)

      this.setState({ successMsg: `Module reloaded successfully` })

      window.setTimeout(() => {
        this.setState({ successMsg: undefined })
      }, 2000)
    } catch (err) {
      console.log(err)
    }
  }

  render() {
    return (
      <Container style={{ marginTop: 50, padding: 20 }}>
        {this.state.successMsg && <Alert type="success">{this.state.successMsg}</Alert>}
        <h3>Module Reloading</h3>
        <div className="bp_table ">
          {this.props.modules.map(module => (
            <div className="bp_table-row">
              <div className="actions">
                <Button color="primary" size="sm" onClick={() => this.reloadModule(module.name)}>
                  Reload
                </Button>
              </div>
              <div className="title">{module.name}</div>
            </div>
          ))}
        </div>
      </Container>
    )
  }
}

const mapStateToProps = state => ({
  ...state.modules
})

export default connect(
  mapStateToProps,
  { fetchModules }
)(Modules)
