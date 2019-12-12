import React, { FC } from 'react'

import style from '../style.scss'

interface Props {
  redirectFlow: string
  redirectNode: string
}

const RedirectInfo: FC<Props> = ({ redirectFlow, redirectNode }) => {
  if (!redirectFlow || !redirectNode) {
    return null
  }

  const flowName = redirectFlow.replace('.flow.json', '')
  const flowBuilderLink = `/studio/${window.BOT_ID}/flows/${flowName}/#search:${redirectNode}`

  return (
    <React.Fragment>
      <div className={style.itemRedirectTitle}>Redirect to:</div>
      <a href={flowBuilderLink}>
        <div className={style.itemFlow}>
          Flow: <span className={style.itemFlowName}>{redirectFlow}</span>
        </div>
        <div className={style.itemNode}>
          Node: <span className={style.itemNodeName}>{redirectNode}</span>
        </div>
      </a>
    </React.Fragment>
  )
}

export default RedirectInfo
