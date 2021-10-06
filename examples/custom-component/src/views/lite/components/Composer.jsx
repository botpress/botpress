// This component is an example on how to replace the composer input of the web chat (text input)
import React, { useState } from 'react'
import style from './style.scss'
// You can use Sass (https://sass-lang.com/documentation/syntax) to style your custom composer

export const Composer = props => {
  const [input, setInput] = useState('')
  const [isDisabled, setIsDisabled] = useState(true)

  const handleChange = e => {
    e.preventDefault()
    setInput(e.target.value)
    if (input === 0) {
      setIsDisabled(true)
    } else {
      setIsDisabled(false)
    }
  }

  const handleOnClick = async e => {
    e.preventDefault()
    if (isDisabled) {
      return
    }
    props.store.composer.updateMessage(input.trim())
    await props.store.sendMessage()
    setInput('')
    setIsDisabled(true)
  }

  return (
    <div className={style.wrapper}>
      <input
        className={style.input}
        type="text"
        placeholder="custom composer input..."
        onChange={handleChange}
        value={input}
      />
      <button className={style.btn} type="button" onClick={handleOnClick}>
        send
      </button>
    </div>
  )
}
