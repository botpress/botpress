import { FlowVariable } from 'botpress/sdk'
import { lang } from 'botpress/shared'
import cx from 'classnames'
import React, { FC, Fragment } from 'react'
import { StandardPortWidget } from '~/views/FlowBuilder/diagram/nodes/Ports'

import { BlockModel } from '../Block'
import style from '../Components/style.scss'

interface Props {
  node: BlockModel
  variables: FlowVariable[]
  selectedNodeItem: () => { node: BlockModel; index: number }
  editNodeItem: (node: BlockModel, index: number) => void
}

const defaultLabels = {
  failure: 'studio.flow.node.workflowFails',
  success: 'studio.flow.node.workflowSucceeds'
}

const SubworkflowContents: FC<Props> = ({ node, selectedNodeItem, editNodeItem, variables }) => {
  const { next } = node || {}
  const selectedContent = selectedNodeItem()
  const hasInputVars = variables.some(v => v.params.isInput)
  const hasOutpurVars = variables.some(v => v.params.isOutput)

  return (
    <Fragment>
      <div className={style.contentsWrapper}>
        {hasInputVars && (
          <div
            onClick={() => editNodeItem(node, 0)}
            className={cx(style.contentWrapper, {
              [style.active]: selectedContent?.node?.id === node.id && selectedContent.index === 0
            })}
          >
            <span className={style.content}>{lang.tr('inputs')}</span>
          </div>
        )}
        {hasOutpurVars && (
          <div
            onClick={() => editNodeItem(node, 1)}
            className={cx(style.contentWrapper, {
              [style.active]: selectedContent?.node?.id === node.id && selectedContent.index === 1
            })}
          >
            <span className={style.content}>{lang.tr('outputs')}</span>
          </div>
        )}
        {next?.map((item, i) => {
          const outputPortName = `out${i}`
          return (
            <div key={`${i}.${item}`} className={style.contentWrapper}>
              <div className={cx(style.content, style.promptPortContent)}>
                {lang.tr(defaultLabels[item.caption])}
                <StandardPortWidget name={outputPortName} node={node} className={cx(style.outRouting, item.caption)} />
              </div>
            </div>
          )
        })}
      </div>
    </Fragment>
  )
}

export default SubworkflowContents
