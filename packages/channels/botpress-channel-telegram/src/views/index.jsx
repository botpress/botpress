import React from 'react'

import style from './style.scss'

export default class ModuleView extends React.Component {
  render() {
    return (
      <div>
        <h2>Help required</h2>
        <h4>
          Botpress Team would really appreciate to have some help from the community to work on this important module.
        </h4>
        <h4>
          By helping us, you will contribute to the core and by the way, you will become one of our{' '}
          <strong>Botpress Leader</strong>!
        </h4>
      </div>
    )
  }
}
