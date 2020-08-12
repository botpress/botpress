import { lang } from 'botpress/shared'
import cx from 'classnames'
import React, { FC, Fragment } from 'react'
import { connect } from 'react-redux'
import { getCallerFlowsOutcomeUsage } from '~/reducers'

import { BlockModel } from '../Block'
import style from '../Components/style.scss'

interface Props {
  node: BlockModel
  selectedNodeItem: () => { node: BlockModel; index: number }
  getCurrentLang: () => string
  outcomes?: { condition: string; caption: string; node: string }[]
}

const OutcomeContents: FC<Props> = ({ node, outcomes }) => {
  const refCount = outcomes?.filter(x => x.condition === `lastNode=${node.name}`).length

  return (
    <Fragment>
      <div className={style.contentsWrapper}>
        <div className={cx(style.contentWrapper)}>
          <span className={style.content}>
            {refCount
              ? lang.tr('studio.flow.referenceCount', { count: refCount })
              : lang.tr('studio.flow.noReferences')}
          </span>
        </div>
      </div>
    </Fragment>
  )
}

const mapStateToProps = state => ({ outcomes: getCallerFlowsOutcomeUsage(state) })
export default connect(mapStateToProps)(OutcomeContents)
