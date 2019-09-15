import React, { Component } from 'react'

import style from '../style.scss'
import { Row, Col, Button, FormControl, FormGroup, InputGroup, Label } from 'react-bootstrap'

export default class QueryTester extends Component {
  state = {
    queryText: ''
  }

  onQueryTextChanged = e => this.setState({ queryText: e.target.value })
  onInputKeyPress = e => e.key === 'Enter' && this.sendQuery()

  sendQuery = async () => !this.props.queryInProgress && this.props.onQuerySearch(this.state.queryText)

  render() {
    return (
      <Row>
        <Col md={4}>
          <div>
            <h3>Test Knowledgebase</h3>
            Type some text and see what would be the most probable answer from your bot
            <div className={style.spacing}>
              <FormGroup>
                <InputGroup>
                  <FormControl
                    value={this.state.queryText}
                    onChange={this.onQueryTextChanged}
                    onKeyPress={this.onInputKeyPress}
                    placeholder="Question"
                    style={{ width: 400 }}
                  />
                  &nbsp;
                  <Button
                    onClick={this.sendQuery}
                    disabled={this.props.queryInProgress || !this.state.queryText || !this.state.queryText.length}
                  >
                    Send
                  </Button>
                  {this.props.queryInProgress ? <p>Query in progress, please wait ...</p> : ''}
                </InputGroup>
              </FormGroup>
            </div>
          </div>
        </Col>
        <Col md={7}>{this.renderResults()}</Col>
      </Row>
    )
  }

  renderResults() {
    if (!this.props.queryResults) {
      return null
    }

    return (
      <div>
        <h3>Top 5 Results</h3>
        {this.props.queryResults.map((result, idx) => {
          const { name, paragraph, page, content } = result

          return (
            <div className={style.searchResult} key={idx}>
              <span className={style.snippetTitle}>{content}</span>
              <div className={style.link}>
                <a href="#" onClick={() => this.props.onView(name)}>
                  {name}
                </a>
              </div>
              Confidence: {this.renderConfidence(result.confidence)} - page {page}, paragraph: {paragraph}
              <hr className={style.separator} />
            </div>
          )
        })}
      </div>
    )
  }

  renderConfidence(confidence) {
    if (confidence >= 0.7) {
      return <Label bsStyle="success">{confidence}</Label>
    } else if (confidence < 0.7 && confidence >= 0.2) {
      return <Label bsStyle="warning">{confidence}</Label>
    } else {
      return <Label>{confidence}</Label>
    }
  }
}
