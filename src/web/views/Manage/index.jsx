import React from 'react'

import ContentWrapper from '~/components/Layout/ContentWrapper'
import PageHeader from '~/components/Layout/PageHeader'
import ModulesComponent from '~/components/Modules'

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
        <div className={style.modules}>
          <ModulesComponent modules={this.state.modules} refresh={this.refresh.bind(this)}/>
        </div>
      </ContentWrapper>
    )
  }
}
