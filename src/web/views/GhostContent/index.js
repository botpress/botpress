import React, { Component } from 'react'
import classnames from 'classnames'
import axios from 'axios'
import groupBy from 'lodash/groupBy'
import sortBy from 'lodash/sortBy'
import mapValues from 'lodash/mapValues'

import { Alert, Button } from 'react-bootstrap'

import ContentWrapper from '~/components/Layout/ContentWrapper'
import PageHeader from '~/components/Layout/PageHeader'
import Loading from '~/components/Util/Loading'

const transformData = data => mapValues(groupBy(data, 'folder'), entries => groupBy(entries, 'file'))

export default class GhostView extends Component {
  state = {
    loading: true,
    data: null,
    error: null
  }

  fetch() {
    this.setState({ loading: true })

    axios
      .get('/ghost_content/status')
      .then(({ data }) => {
        this.setState({ data: transformData(data), loading: false, error: null })
      })
      .catch(error => {
        this.setState({ error: error.message || 'Unknown', loading: false })
      })
  }

  componentDidMount() {
    this.fetch()
  }

  renderRevision({ folder, file, revision, created_on: createdOn }) {
    return (
      <li key={`${folder}/${file}/${revision}`}>
        {revision}, created {createdOn}
      </li>
    )
  }

  renderFile(folder, file, data) {
    data = sortBy(data, 'created_on')
    return (
      <li key={`${folder}/${file}`}>
        <strong>{file}</strong>
        <ul>{data.map(datum => this.renderRevision(datum))}</ul>
      </li>
    )
  }

  renderFolder(folder, data) {
    const files = Object.keys(data).sort()
    return (
      <li key={folder}>
        <strong>{folder}</strong>
        <ul>{files.map(file => this.renderFile(folder, file, data[file]))}</ul>
      </li>
    )
  }

  renderContent() {
    const { data } = this.state
    const folders = Object.keys(data).sort()

    return <ul>{folders.map(folder => this.renderFolder(folder, data[folder]))}</ul>
  }

  renderBody() {
    const { loading, error } = this.state

    if (loading) {
      return <Loading />
    }

    if (error) {
      return (
        <Alert bsStyle="danger">
          <p>Error fetching status dta: {error}.</p>
          <p>
            <Button bsStyle="info" onClick={() => this.fetch()}>
              Try again
            </Button>
          </p>
        </Alert>
      )
    }

    return this.renderContent()
  }

  render() {
    return (
      <ContentWrapper>
        <PageHeader>Ghost Content</PageHeader>
        {this.renderBody()}
      </ContentWrapper>
    )
  }
}
