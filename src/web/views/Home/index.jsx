import React from 'react'

import ContentWrapper from '~/components/Layout/ContentWrapper'
import InjectedComponent from '~/components/Injected'
import PageHeader from '~/components/Layout/PageHeader'
import {Glyphicon} from 'react-bootstrap'

const LandingPage = require('~/__landing').landing
const style = require('./style.scss')

export default class HomeView extends React.Component {
  constructor(props, context) {
    super(props, context)
  }

  render() {
    return <ContentWrapper>
      {PageHeader(<span><Glyphicon glyph="home"/> Home</span>)}
      <InjectedComponent component={LandingPage} />
    </ContentWrapper>
  }
}
