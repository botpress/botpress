import React, { FC } from 'react'

// Needed a very simple button with no blueprint styling that would process the onClick
interface Props {
  onClick?: () => void
  className?: string
  children?: any
}

const Button: FC<Props> = props => {
  const { onClick, className, children } = props

  return (
    <button className={className} onClick={onClick} type="button">
      {children}
    </button>
  )
}

export default Button
