import React, { FC, useEffect } from 'react'

import { ApiType } from '../Api'
import { EscalationType } from '../../../types'

import { Grid, Row, Col } from 'react-flexbox-grid'
import { EmptyState, Tabs, lang } from 'botpress/shared'
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
          <Tabs tabs={[{ id: 'conversation', title: lang.tr('module.hitl2.tab') }]} />
        </Col>
        <Col md={4}>
          <Tabs tabs={[{ id: 'user', title: lang.tr('module.hitl2.tab') }]} />
          <Sidebar api={props.api} escalation={props.escalation}></Sidebar>
        </Col>
      </Row>
    </Grid>
  ) : (
    <EmptyState icon={<AgentsIcon />} text={lang.tr('module.hitl2.conversation.empty')}></EmptyState>
  )
}

export default Conversation
