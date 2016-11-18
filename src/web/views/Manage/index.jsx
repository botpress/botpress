import React from 'react'

import ContentWrapper from '~/components/Layout/ContentWrapper'
import PageHeader from '~/components/Layout/PageHeader'
import ModulesComponent from '~/components/Modules'

import axios from 'axios'

const style = require('./style.scss')

export default class ManageView extends React.Component {
  constructor(props) {
    super(props)
    this.state = { modules: [] }
  }

  componentDidMount() {
    this.queryModules()
  }

  queryModules() {
    axios.get('/api/manager/modules')
    .then((result) => {
      this.setState({
        modules: result.data
      })
    })
  }

  render() {
    return (
      <ContentWrapper>
        {PageHeader(<span> Modules</span>)}
        <div className={style.modules}>
          <ModulesComponent modules={this.state.modules}/>
        </div>
      </ContentWrapper>
    )
  }
}
