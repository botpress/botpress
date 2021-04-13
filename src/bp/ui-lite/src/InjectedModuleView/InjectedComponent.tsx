import React, { Component } from 'react'

interface Props {
  component: Function
}

interface State {
  error?: Error
}

export default class InjectedComponent extends Component<Props, State> {
  state: State = {
    error: undefined
  }

  componentDidCatch(error, info) {
    console.error(error, info)
    this.setState({ error })
  }

  render() {
    const { component: Component, ...props } = this.props
    if (!this.state.error) {
      return <Component {...props} />
    }

    return (
      <div className="panel panel-danger">
        <div className="panel-heading">Could not display component</div>
        <div className="panel-body">
          <h4>An error occurred while loading the component</h4>
          <p>{this.state.error.message}</p>
        </div>
        <div className="panel-footer">
          Developer? <a href="https://botpress.com/docs">click here</a> to see why this might happen
        </div>
      </div>
    )
  }
}
