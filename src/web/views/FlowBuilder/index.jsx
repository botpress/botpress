import React, { Component } from 'react'
import classnames from 'classnames'
import axios from 'axios'
import _ from 'lodash'

import ContentWrapper from '~/components/Layout/ContentWrapper'
import PageHeader from '~/components/Layout/PageHeader'

const style = require('./style.scss')

export default class FlowBuilder extends Component {
  constructor(props) {
    super(props)
    this.state = {}
  }

  componentDidMount() {}

  render() {
    return (
      <ContentWrapper stretch={true}>
        <PageHeader>
          <span>Flow Builder</span>
        </PageHeader>
        <h1>Hello!</h1>
      </ContentWrapper>
    )
  }
}
