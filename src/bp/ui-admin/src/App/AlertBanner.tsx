import React, { FC, MouseEvent } from 'react'

interface Props {
  message?: string;
  type: string;
  hideCloseBtn: boolean;
  onClick: (event: MouseEvent<HTMLButtonElement>) => void;
}

const AlertBanner: FC<Props> = ({ type, message, hideCloseBtn, onClick, children }) => {
  return (
    <div className={`alert-banner ${type}`}>
      {message || children}
      {!hideCloseBtn && <button className="alert-banner--close-btn" onClick={onClick}>×</button>}
    </div>
  )
}

export default AlertBanner
