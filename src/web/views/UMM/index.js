
import React, { Component } from 'react'
import classnames from 'classnames'

import ContentWrapper from '~/components/Layout/ContentWrapper'
import PageHeader from '~/components/Layout/PageHeader'

import { Grid, Row, Col, Panel } from 'react-bootstrap'

const style = require('./style.scss')

export default class UMMView extends Component {
  constructor(props) {
    super(props)
  }

  render() {
    const classNames = classnames({
      [style.umm]: true,
      'bp-umm': true
    })

    return (
      <ContentWrapper>
        <PageHeader><span>Universal Message Markdown</span></PageHeader>
        <Grid fluid>
          <Row className={classNames}>
            <Col>
              <h1>UMM</h1>
            </Col>
          </Row>
        </Grid>
      </ContentWrapper>
    )
  }
}
