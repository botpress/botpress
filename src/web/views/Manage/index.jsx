import React from 'react'

import ContentWrapper from '~/components/Layout/ContentWrapper'
import PageHeader from '~/components/Layout/PageHeader'
import ModulesComponent from '~/components/Modules'

import { Grid, Row, Col } from 'react-bootstrap'

import axios from 'axios'

import actions from '~/actions'

const style = require('./style.scss')

export default class ManageView extends React.Component {
  constructor(props) {
    super(props)
    this.state = { modules: [] }
    this.queryModules = this.queryModules.bind(this)
  }

  componentDidMount() {
    this.queryModules()
  }

  queryModules() {
    return axios.get('/api/module/all')
    .then((result) => {
      this.setState({
        modules: result.data
      })
    })
  }

  refresh() {
    this.queryModules()
    .then(() => {
      setTimeout(actions.fetchModules, 5000)
    })
  }

  render() {
    return (
      <ContentWrapper>
        {PageHeader(<span> Modules</span>)}
        <Grid fluid>
          <Row>
            <Col sm={12} md={8} mdOffset={2}>
              <ModulesComponent modules={this.state.modules} refresh={this.refresh.bind(this)}/>
            </Col>
          </Row>
        </Grid>
      </ContentWrapper>
    )
  }
}
