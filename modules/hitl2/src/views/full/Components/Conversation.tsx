import React, { FC, useContext } from 'react'
import _ from 'lodash'
import cx from 'classnames'

import { ApiType } from '../Api'
import { EscalationType } from '../../../types'

import { Context } from '../app/Store'

import { Row, Col } from 'react-flexbox-grid'
import { Button } from '@blueprintjs/core'
import { EmptyState, Tabs, toast, lang } from 'botpress/shared'
import AgentsIcon from './../Icons/AgentsIcon'
import Sidebar from './Sidebar'

import styles from './../style.scss'

interface Props {
  api: ApiType
  escalation?: EscalationType
}

const Conversation: FC<Props> = props => {
  const { state, dispatch } = useContext(Context)
  const { api } = props

  async function handleAssign() {
    try {
      const escalation = await api.assignEscalation(props.escalation.id)
      api.setOnline()
      toast.success(lang.tr('module.hitl2.escalation.assign', { id: escalation.id }))
    } catch (error) {
      if (_.inRange(error.response.status, 400, 499)) {
        toast.failure(error.response.data.errors[0].detail)
      } else {
        dispatch({ type: 'setError', payload: error })
      }
    }
  }

  async function handleResolve() {
    try {
      const escalation = await api.resolveEscalation(props.escalation.id)
      api.setOnline()
      toast.success(lang.tr('module.hitl2.escalation.resolve', { id: escalation.id }))
    } catch (error) {
      if (_.inRange(error.response.status, 400, 499)) {
        toast.failure(error.response.data.errors[0].detail)
      } else {
        dispatch({ type: 'setError', payload: error })
      }
    }
  }

  return (
    <Row className={cx(styles.h100)}>
      {!props.escalation && (
        <Col xs={12} className={cx(styles.h100)}>
          <Tabs
            tabs={[{ id: 'conversation', title: lang.tr('module.hitl2.tab') }]}
            style={{ marginBottom: 'var(--spacing-xx-large)' }}
          />
          <EmptyState icon={<AgentsIcon />} text={lang.tr('module.hitl2.conversation.empty')}></EmptyState>
        </Col>
      )}

      {props.escalation && (
        <Col md={8} className={cx(styles.h100)}>
          <Tabs
            tabs={[{ id: 'conversation', title: lang.tr('module.hitl2.tab') }]}
            style={{ marginBottom: 'var(--spacing-xx-large)' }}
          />
          <Button onClick={handleAssign}>Assign to me</Button>
          <Button onClick={handleResolve}>Resolve</Button>
        </Col>
      )}

      {props.escalation && (
        <Col md={4} className={cx(styles.h100)}>
          <div
            className={cx(styles.h100)}
            style={{ paddingLeft: 'var(--spacing-xx-large)', borderLeft: '1px solid var(--seashell)' }}
          >
            {props.escalation && (
              <Tabs
                tabs={[{ id: 'user', title: lang.tr('module.hitl2.tab') }]}
                style={{ marginBottom: 'var(--spacing-xx-large)' }}
              />
            )}
            {props.escalation && <Sidebar api={props.api} escalation={props.escalation}></Sidebar>}
          </div>
        </Col>
      )}
    </Row>
  )
}

export default Conversation
