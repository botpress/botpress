import React, { FC, MouseEvent } from 'react'

interface Props {
  message?: string;
  type: string;
  hideCloseBtn: boolean;
  hide: () => void;
  timeout: number;
}

const AlertBanner: FC<Props> = ({ type, message, hideCloseBtn, hide, children, timeout }) => {
  let hideTimeout

  if (timeout !== 0) {
    hideTimeout = window.setTimeout(() => {
      hide()
    }, timeout)
  }

  const onHide = () => {
    if (hideTimeout) {
      window.clearTimeout(hideTimeout)
    }

    hide()
  }

  return (
    <div className={`alert-banner ${type}`}>
      {message || children}
      {!hideCloseBtn && <button className="alert-banner--close-btn" onClick={onHide}>×</button>}
    </div>
  )
}

AlertBanner.defaultProps = {
  timeout: 2000
};

export default AlertBanner
