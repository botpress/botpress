import {
  Container,
  InfoTooltip,
  Item,
  ItemList,
  KeyboardShortcut,
  SearchBar,
  SectionAction,
  SidePanel,
  SidePanelSection,
  SplashScreen
} from 'botpress/ui'
import React from 'react'

import SidePanelContent from './SidePanel'

const getDefaultLanguage = (languages: string[]) => {
  if (languages.includes('en')) {
    return 'en'
  }
  return languages[0]
}

export default class MisunderstoodMainView extends React.Component<{ bp: { axios: any } }> {
  state = {
    languages: null,
    loaded: false
  }

  async loadData() {
    const {
      data: { languages }
    } = await this.props.bp.axios.get('/')
    return { languages, language: getDefaultLanguage(languages) }
  }

  async componentDidMount() {
    const data = await this.loadData()

    this.setState({ ...data, loaded: true })
  }

  render() {
    const { loaded, languages, language } = this.state

    return (
      <Container>
        <SidePanel>{loaded && <SidePanelContent languages={languages} language={language} />}</SidePanel>

        {loaded ? (
          <div>Your module stuff here</div>
        ) : (
          <SplashScreen title="Loading..." description="Please wait while we're loading data" />
        )}
      </Container>
    )
  }
}
