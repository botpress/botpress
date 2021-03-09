import React, { FC, useState } from 'react'
interface Props {
  bp: { axios }
}

const SpellCheckerUI: FC<Props> = props => {
  const [result, setResult] = useState('')
  const [suggestions, setSuggestions] = useState([[]] as string[][])
  const [input, setInput] = useState('')

  const correct = async () => {
    const { data } = await props.bp.axios.post('/mod/spellchecker/correct', { sentence: input })
    setResult(data)
  }

  const suggest = async () => {
    const { data } = await props.bp.axios.post('/mod/spellchecker/suggest', { sentence: input })
    setSuggestions(data)
  }

  const changeInput = event => {
    setInput(event.target.value)
  }

  return (
    <div>
      <h1>PLOP</h1>
      <div>
        <input type="text" value={input} onChange={changeInput} />
        <button type="button" onClick={correct}></button>
        <button type="button" onClick={suggest}></button>
        <h3>Correction</h3>
        <div>{result}</div>
        <h3>Suggestions</h3>
        <div>{suggestions}</div>
      </div>
    </div>
  )
}

export default SpellCheckerUI
