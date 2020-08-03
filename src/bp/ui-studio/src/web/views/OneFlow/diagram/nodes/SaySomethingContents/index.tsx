import { Contents } from 'botpress/shared'
import React, { FC } from 'react'

import { BlockModel } from '../Block'
import style from '../Components/style.scss'

interface Props {
  node: BlockModel
  editNodeItem: (node: BlockModel, index: number) => void
  selectedNodeItem: () => { node: BlockModel; index: number }
  getCurrentLang: () => string
}

const SaySomethingContents: FC<Props> = ({ node, editNodeItem, selectedNodeItem, getCurrentLang }) => {
  const currentLang = getCurrentLang()

  const selectedContent = selectedNodeItem()

  return (
    <div className={style.contentsWrapper}>
      {node.contents?.map((content, index) => (
        <Contents.Item
          active={selectedContent?.node?.id === node.id && index === selectedContent?.index}
          key={`${index}${currentLang}`}
          onEdit={() => editNodeItem?.(node, index)}
          contentLang={getCurrentLang()}
          content={content}
        />
      ))}
    </div>
  )
}

export default SaySomethingContents
