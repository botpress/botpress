import React from 'react'

import ContentWrapper from '~/components/Layout/ContentWrapper'
import InjectedComponent from '~/components/Injected'

const LandingPage = require('~/__landing').landing
const style = require('./style.scss')

export default class HomeView extends React.Component {
  constructor(props, context) {
    super(props, context)
  }

  render() {
    return <ContentWrapper>
      <InjectedComponent component={LandingPage} />
    </ContentWrapper>
  }
}
