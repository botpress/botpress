import React from 'react'
import { Jumbotron, Button, Glyphicon } from 'react-bootstrap'

import style from './style.scss'

export default ({ onRecordClicked }) => (
  <div>
    <Jumbotron className={style.empty}>
      <h3>No conversation scenarios</h3>
      <p>
        Scenarios are a great way to ensure your bot still behaves the same while your making changes to it. They are
        the conversation design version software unit tests. Instead of going through every possible conversation path
        everytime you change something in your bot, automate it by recording and running scenarios. Check out{' '}
        <a target="_blank" href="https://github.com/botpress/botpress/tree/master/modules/testing/README.md">
          the docs
        </a>{' '}
        if you need help.
      </p>
      <Button bsStyle="primary" onClick={onRecordClicked}>
        <Glyphicon glyph="record" />
        &nbsp; Record new scenario
      </Button>
    </Jumbotron>
  </div>
)
