import React from 'react'

// const style = require('./style.scss')

export default class ModuleView extends React.Component {
  constructor(props, context) {
    super(props, context)
  }

  render() {
    return <h1>Module {this.props.params.moduleName}</h1>
  }
}
