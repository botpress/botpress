import cx from 'classnames'
import React, { FC } from 'react'
import { StandardPortWidget } from '~/views/FlowBuilder/diagram/nodes/Ports'

import { BlockModel } from '../Block'
import style from '../Components/style.scss'

interface Props {
  node: BlockModel
  selectedNodeItem: () => { node: BlockModel; index: number }
  getCurrentLang: () => string
}

const PromptContents: FC<Props> = ({ node, selectedNodeItem, getCurrentLang }) => {
  const currentLang = getCurrentLang()
  const selectedContent = selectedNodeItem()
  const { next } = node || {}
  const { params } = node.prompt || {}

  return (
    <div className={style.contentsWrapper}>
      <div
        className={cx(style.contentWrapper, {
          [style.active]: selectedContent?.node?.id === node.id
        })}
      >
        <span className={style.content}>{params?.question?.[currentLang]}</span>
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
  )
}

export default PromptContents
