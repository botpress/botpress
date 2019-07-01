import React from 'react'
import Tour from 'reactour'
import storage from '../../util/storage'
import { Button } from '@blueprintjs/core'

// Change this key to display the tour the next time a user opens Botpress
const TOUR_KEY = 'guidedTour11_9_0'

export default class GuidedTour extends React.Component {
  componentDidMount() {
    if (!storage.get(TOUR_KEY)) {
      storage.set(TOUR_KEY, true)
      this.props.onToggle()
    }
  }

  componentDidCatch(error) {
    console.log('Error while processing guided tour', error)
  }

  render() {
    const steps = [
      {
        selector: '',
        content: 'Welcome to Botpress! This is a quick tour of the most important features.'
      },
      {
        selector: '#bp-menu_qna',
        content: 'The QnA module is great for easily adding knowledge to you bot as "Question & Answer" pairs.'
      },
      {
        selector: '#bp-menu_nlu',
        content:
          'The "Understanding" screen will allow you to understand more complex user queries (Intents) and extract structured information (Entities).'
      },
      {
        selector: '#bp-menu_Flows',
        content:
          'The "Flows" screen is the main interface. Using this tool, you can go beyond static responses by designing more complex, multi-turn dialogs.'
      },
      {
        selector: '#statusbar_emulator',
        content:
          'When making changes to your bot, you will use the Emulator to chat with your bot and debug your conversations.'
      },
      {
        selector: '#statusbar_switchbot',
        content: 'Finally, this button will allow you to return to the administration panel or switch bot.'
      }
    ]

    return (
      <Tour
        steps={steps}
        isOpen={this.props.isDisplayed}
        onRequestClose={this.props.onToggle}
        lastStepNextButton={<Button>Let's get to work!</Button>}
      />
    )
  }
}
