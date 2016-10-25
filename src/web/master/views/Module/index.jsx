import React from 'react'
import { modules } from '~/modules'

// const style = require('./style.scss')

export default class ModuleView extends React.Component {
  constructor(props, context) {
    super(props, context)
  }

  render() {
    const { moduleName } = this.props.params
    console.log(modules)
    // return moduleView;
    return <h1>Module {this.props.params.moduleName}</h1>
  }
}
