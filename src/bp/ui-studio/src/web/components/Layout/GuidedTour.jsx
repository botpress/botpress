import React from 'react'
import Tour from 'reactour'
import storage from '../../util/storage'

// Change this key to display the tour the next time a user opens Botpress
const TOUR_KEY = 'guidedTour11_9_0'

export default class GuidedTour extends React.Component {
  state = {
    steps: undefined,
    isDisplayed: false
  }

  componentDidMount() {
    if (!storage.get(TOUR_KEY)) {
      this.setState({ isDisplayed: true })
    }
  }

  closeTour = () => {
    this.setState({ isDisplayed: false })
    storage.set(TOUR_KEY, true)
  }

  render() {
    const steps = [
      {
        selector: '',
        content: 'Welcome to Botpress ! This is a quick your of the most important features'
      },
      {
        selector: '#sidebar_emulator',
        content: 'The emulator allows you to easily test your bot'
      },
      {
        selector: '#sidebar_switchbot',
        content: 'Click here to return to the Admin UI and change bot'
      }
    ]

    return <Tour steps={steps} isOpen={this.state.isDisplayed} onRequestClose={this.closeTour} />
  }
}
