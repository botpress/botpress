import React from 'react'

export default (props) => {
  const { pages } = props

  return (
    <div>
      <h1>Pages</h1>
      { pages.map(({ id, name }) => <div key={id} onClick={()=> { window.alert(id) }}>{name}</div>) }
      <button onClick={()=> {
        window.alert('aaa')
      }}>Click me</button>
    </div>
  )
}
