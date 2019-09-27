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
} from "botpress/ui"
import React from "react"

import SidePanelContent from './SidePanel'

// This view is a sample including all the features of Botpress UI
export default class MyMainView extends React.Component<{ bp: { axios: any } }> {
  state = {
    languages: null,
    loaded: false
  }

  async loadData() {
    const { data: { languages } } = await this.props.bp.axios.get('/')
    console.log(languages)
    return { languages }
  }

  async componentDidMount() {
    const data = await this.loadData()
    this.setState({ ...data, loaded: true })
  }

  render() {
    const { loaded, languages } = this.state;

    return (
      <Container>

        <SidePanel>
          {loaded && <SidePanelContent languages={languages} />}
        </SidePanel>

        {loaded ? <div>Your module stuff here</div> : <SplashScreen
          title="Loading..."
          description="Please wait while we're loading data"
        />}

      </Container>
    )
  }
}
