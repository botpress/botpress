import cx from 'classnames'
import React, { FC, Fragment } from 'react'
import { StandardPortWidget } from '~/views/FlowBuilder/diagram/nodes/Ports'

import { BlockModel } from '../Block'
import style from '../Components/style.scss'

interface Props {
  node: BlockModel
  selectedNodeItem: () => { node: BlockModel; index: number }
  getCurrentLang: () => string
  editNodeItem: (node: BlockModel, index: number) => void
}

const SubworkflowContents: FC<Props> = ({ node, selectedNodeItem, editNodeItem }) => {
  const { next } = node || {}
  const selectedContent = selectedNodeItem()

  return (
    <Fragment>
      <div className={style.contentsWrapper}>
        <div
          onClick={() => editNodeItem(node, 0)}
          className={cx(style.contentWrapper, {
            [style.active]: selectedContent?.node?.id === node.id && selectedContent.index === 0
          })}
        >
          <span className={style.content}>{'Input'}</span>
        </div>
        <div
          onClick={() => editNodeItem(node, 1)}
          className={cx(style.contentWrapper, {
            [style.active]: selectedContent?.node?.id === node.id && selectedContent.index === 1
          })}
        >
          <span className={style.content}>{'Output'}</span>
        </div>
        {next?.map((item, i) => {
          const outputPortName = `out${i}`
          return (
            <div key={`${i}.${item}`} className={style.contentWrapper}>
              <div className={cx(style.content, style.promptPortContent)}>
                {item.caption}
                <StandardPortWidget name={outputPortName} node={node} className={style.outRouting} />
              </div>
            </div>
          )
        })}
      </div>
    </Fragment>
  )
}

export default SubworkflowContents
