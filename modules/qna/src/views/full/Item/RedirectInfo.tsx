import { Icon, Intent, Tooltip } from '@blueprintjs/core'
import { Flow } from 'botpress/sdk'
import { getFlowLabel } from 'botpress/utils'
import _ from 'lodash'
import React, { FC } from 'react'

import style from '../style.scss'

interface Props {
  id: string
  redirectFlow: string
  redirectNode: string
  flows?: Flow[]
  onEditItem: (id: string) => void
}

const RedirectInfo: FC<Props> = ({ id, redirectFlow, redirectNode, flows, onEditItem }) => {
  if (!redirectFlow || !redirectNode) {
    return null
  }

  const flowName = redirectFlow.replace(/\.flow\.json$/i, '')
  const flowBuilderLink = `/studio/${window.BOT_ID}/flows/${flowName}/#search:${redirectNode}`
  let incorrectRedirection = false
  if (flows) {
    const flow = _.find(flows, f => f.name === redirectFlow)
    incorrectRedirection = !flow || !_.find(flow.nodes, n => n.name === redirectNode)
  }

  return (
    <React.Fragment>
      <div className={style.itemRedirectTitle}>
        Redirect to:
        {incorrectRedirection && (
          <a onClick={() => onEditItem(id)}>
            <Tooltip content="Incorrect redirection">
              <Icon icon="warning-sign" intent={Intent.DANGER} />
            </Tooltip>
          </a>
        )}
      </div>
      <a href={flowBuilderLink}>
        <div className={style.itemFlow}>
          Flow: <span className={style.itemFlowName}>{getFlowLabel(redirectFlow)}</span>
        </div>
        <div className={style.itemNode}>
          Node: <span className={style.itemNodeName}>{redirectNode}</span>
        </div>
      </a>
    </React.Fragment>
  )
}

export default RedirectInfo
