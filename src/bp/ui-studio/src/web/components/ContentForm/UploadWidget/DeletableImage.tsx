import { Button, Intent, Position, Tooltip } from '@blueprintjs/core'
import { lang } from 'botpress/shared'
import React, { FC } from 'react'
import style from '~/views/FlowBuilder/sidePanelTopics/form/style.scss'

interface IImageProps {
  value: string | null
  onDelete(): void
}

const DeletableImage: FC<IImageProps> = props => {
  const { value } = props

  return (
    <div style={{ backgroundImage: `url('${value}')` }} className={style.imgWrapper}>
      <div className={style.imgWrapperActions}>
        <Tooltip content={lang.tr('delete')} position={Position.TOP}>
          <Button minimal small intent={Intent.DANGER} icon="trash" onClick={props.onDelete}></Button>
        </Tooltip>
      </div>
    </div>
  )
}

export default DeletableImage
