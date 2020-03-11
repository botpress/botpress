import React, { FC } from 'react'

import { ButtonProps } from './typings'
// Needed a very simple button with no blueprint styling that would process the onClick

const Button: FC<ButtonProps> = props => {
  const { onClick, className, children } = props

  return (
    <button className={className} onClick={onClick} type="button">
      {children}
    </button>
  )
}

export default Button
