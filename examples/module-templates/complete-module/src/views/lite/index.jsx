import React from 'react'

/**
 * The lite views are meant to be lightweight. They shouldn't include heavy dependencies.
 * Common use case is to add custom components on the web chat. It's also possible to share them to other modules
 *
 * Even if you don't plan to include a lite view, you must include an empty view that returns 'null'
 */
export class LiteView extends React.Component {
  render() {
    return null
  }
}
