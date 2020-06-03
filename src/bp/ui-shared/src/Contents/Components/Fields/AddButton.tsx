import { Button } from '@blueprintjs/core'
import React, { FC } from 'react'

import style from '../style.scss'
import { AddButtonProps } from '../typings'

const AddButton: FC<AddButtonProps> = ({ text, onClick }) => (
  <Button className={style.addBtn} minimal icon="plus" onClick={onClick} text={text} />
)

export default AddButton
