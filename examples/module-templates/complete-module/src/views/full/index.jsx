import React from 'react'

/**
 * This is an example on how you may export multiple components from your view
 * If your module offers custom Skills, you would export your skill components here
 */
export { Example1 } from './example1'
export { Example2 } from './example2'

/**
 * This file is the full view of your module. It automatically includes heavy dependencies, like react-bootstrap
 * If you want to display an interface for your module, export your principal view as "default"
 */
export default class MyMainView extends React.Component {
  render() {
    return <div>Some interface</div>
  }
}
