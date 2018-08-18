import React, { Component } from 'react'
import _ from 'lodash'

import { Alert, Row, Col, Card, CardTitle, CardText, Button } from 'reactstrap'

import api from '../api'

export default class CallbackGrant extends Component {
  render() {
    const { identity, url, botName } = _.get(this.props, 'location.query')

    const close = async () => {
      window.close()
    }

    const proceed = async () => {
      try {
        await api.getAnonymous().get(url, {
          params: { identity }
        })
      } finally {
        close()
      }
    }

    return (
      <div className="centered-container">
        <div className="middle">
          <Row style={{ margin: 0 }}>
            <Col sm="12" md={{ size: 4, offset: 4 }}>
              <div>
                <Card body>
                  <CardTitle>{botName} wants to know your identity</CardTitle>
                  <CardText>
                    The bot <b>{botName}</b> wants to access your identity. If you click <i>I Agree</i>, the following
                    information will be provided to the bot:
                  </CardText>
                  <ul>
                    <li>Username</li>
                    <li>Email</li>
                    <li>Full name</li>
                    <li>Avatar</li>
                  </ul>
                  <Alert color="warning">
                    If you haven't initiated this action or do not trust this bot, please close this page or click
                    <i> Cancel</i>.
                  </Alert>
                  <Button color="primary" onClick={proceed}>
                    I agree
                  </Button>
                  <hr />
                  <Button color="danger" outline>
                    Cancel
                  </Button>
                </Card>
              </div>
            </Col>
          </Row>
        </div>
      </div>
    )
  }
}
