import { Button } from '@blueprintjs/core'
import { lang } from 'botpress/shared'
import React, { FC, useState } from 'react'
import NPSModal from './NPSModal'

import style from './style.scss'

interface Props {
  onDismissed?: () => void
}
const NPSAdditionComment: FC<Props> = props => {
  const [showForm, setShowForm] = useState(false)
  const openModal = e => {
    e.preventDefault()
    setShowForm(!showForm)
  }
  const handleDismiss = () => {
    props.onDismissed && props.onDismissed()
  }
  const handleChange = e => {
    setShowForm(!e.target.value)
    handleDismiss()
  }

  return (
    <div className={style.flexBox}>
      <p>{lang.tr('admin.netPromotingScore.feedback')}</p>
      <Button intent="primary" onClick={openModal}>
        {lang.tr('admin.netPromotingScore.moreContent')}
      </Button>
      {showForm && <NPSModal modalValue={showForm} onChange={handleChange} />}
    </div>
  )
}

export default NPSAdditionComment
