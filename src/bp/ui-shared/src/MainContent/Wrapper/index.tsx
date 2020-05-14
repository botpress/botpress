import React, { FC } from 'react'

import style from './style.scss'
import { WrapperProps } from './typings'

const Wrapper: FC<WrapperProps> = props => {
  return (
    <div ref={ref => props.childRef?.(ref)} className={style.wrapper}>
      {...props.children}
    </div>
  )
}

export default Wrapper
