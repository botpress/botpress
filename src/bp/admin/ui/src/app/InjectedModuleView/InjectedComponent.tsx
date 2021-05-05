import { Callout } from '@blueprintjs/core'
import React, { Component } from 'react'
import style from './style.scss'

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

    if (this.state.error.message === "Cannot read property 'getCurrentStack' of undefined") {
      console.error(
        'This error happens because the admin panel runs react in production mode, while modules uses react in development mode. It is not visible in production.'
      )
    }

    return (
      <div className={style.errorContainer}>
        <Callout title="Could not display component">
          An error occurred while loading the component. Additional details are available on the browser's console.
        </Callout>
      </div>
    )
  }
}
