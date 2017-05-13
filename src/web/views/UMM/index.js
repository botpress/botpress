
import React, { Component } from 'react'
import classnames from 'classnames'

import ContentWrapper from '~/components/Layout/ContentWrapper'
import PageHeader from '~/components/Layout/PageHeader'

import List from './List'
import Code from './Code'
import Preview from './Preview'

import { Grid, Row, Col, Panel } from 'react-bootstrap'

const style = require('./style.scss')

export default class UMMView extends Component {
  constructor(props) {
    super(props)

    this.state = {
      loading: true
    }
  }

  componentDidMount() {
    this.fetchBlocks()

    this.setState({
      loading: false
    })
  }

  fetchBlocks() {
    this.state = {
      blocks: {}
    }
  }

  renderLeftSection() {
    const classNames = classnames({
      [style.left]: true,
      'bp-umm-left': true
    })

    return <Row className={classNames}>
        <Col md={12}>
          <List />
        </Col>
      </Row>
  }

  renderCenterSection() {
    const classNames = classnames({
      [style.center]: true,
      'bp-umm-center': true
    })

    return <Row className={classNames}>
        <Col md={12}>
          <Code />
        </Col>
      </Row>
  }

  renderRightSection() {
    const classNames = classnames({
      [style.right]: true,
      'bp-umm-right': true
    })

    return <Row className={classNames}>
        <Col md={12}>
          <Preview />
        </Col>
      </Row>
  }

  render() {
    if (this.state.loading) {
      return null
    }

    const classNames = classnames({
      [style.umm]: true,
      'bp-umm': true
    })

    return (
      <ContentWrapper>
        <PageHeader><span>Universal Message Markdown</span></PageHeader>
        <Grid fluid>
          <Row className={classNames}>
            <Col md={2}>
              {this.renderLeftSection()}
            </Col>
            <Col md={5}>
              {this.renderCenterSection()}
            </Col>
            <Col md={5}>
              {this.renderRightSection()}
            </Col>
          </Row>
        </Grid>
      </ContentWrapper>
    )
  }
}
