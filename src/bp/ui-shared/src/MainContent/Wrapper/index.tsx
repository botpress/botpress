import React, { FC } from 'react'

import style from './style.scss'
import { WrapperProps } from './typings'

const Wrapper: FC<WrapperProps> = props => <div className={style.wrapper}>{...props.children}</div>

export default Wrapper
