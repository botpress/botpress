import React, { FC, useEffect } from 'react'

import { ApiType } from '../Api'
import { EscalationType } from '../../../types'

import { Grid, Row, Col } from 'react-flexbox-grid'
import { EmptyState, lang } from 'botpress/shared'
import AgentsIcon from './../Icons/AgentsIcon'
import Sidebar from './Sidebar'

interface Props {
  api: ApiType
  escalation?: EscalationType
}

const Conversation: FC<Props> = props => {
  return props.escalation ? (
    <Grid>
      <Row>
        <Col md={8}>
          <h4>Current Conversation</h4>
        </Col>
        <Col md={4}>
          <Sidebar api={props.api} escalation={props.escalation}></Sidebar>
        </Col>
      </Row>
    </Grid>
  ) : (
    <EmptyState icon={<AgentsIcon />} text={lang.tr('module.hitl2.conversation.empty')}></EmptyState>
  )
}

export default Conversation
