import { Button } from '@blueprintjs/core'
import React, { FC, useState } from 'react'
import NPSModal from './NPSModal'

import style from './style.scss'

const NPSAdditionComment: FC = () => {
  const [showForm, setShowForm] = useState(false)
  const openModal = e => {
    e.preventDefault()
    setShowForm(!showForm)
  }
  const handleChange = e => {
    setShowForm(!e.target.value)
  }

  return (
    <div className={style.flexBox}>
      <p>Thanks for your feedback!</p>
      <Button intent="primary" onClick={openModal}>
        Provide additional comments
      </Button>
      {showForm && <NPSModal modalValue={showForm} onChange={handleChange} />}
    </div>
  )
}

export default NPSAdditionComment
