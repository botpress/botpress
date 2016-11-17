import React from 'react'

import ContentWrapper from '~/components/Layout/ContentWrapper'
import PageHeader from '~/components/Layout/PageHeader'
import {Glyphicon} from 'react-bootstrap'

const style = require('./style.scss')

export default class ManageView extends React.Component {
  constructor(props, context) {
    super(props, context)
  }

  render() {
    return <ContentWrapper>
      {PageHeader(<span><i className="icon material-icons">build</i> Manage</span>)}
      <h1>Manage</h1>
    </ContentWrapper>
  }
}
