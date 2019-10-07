import { Button, Card, ControlGroup, InputGroup, MenuItem } from "@blueprintjs/core"
import { MultiSelect } from '@blueprintjs/select'
import { AxiosStatic } from "axios"
import classnames from "classnames"
import React from "react"

import style from './style.scss'
import ApiClient from "./NLUApiClient"
import Pager from "./Pager"
import VariationsOverlay from "./VariationsOverlay"

const ITEMS_PER_PAGE = 5

interface Props {
  axios: AxiosStatic
  language: string
  selected: string
  params: string | object | null
  onSelect: (id: string | null, params?: string | object | null) => void
}

interface Intent {
  name: string
  slots: {
    id: string
    color: number
    name: string
    entities: string[]
  }
  utterances: {
    [lang: string]: string[]
  }
  contexts: string[]
}

interface State {
  page: number
  intents: Intent[]
  displayIntents: Intent[],
  filteredIntentsCount: number
}

class IntentPicker extends React.Component<Props, State> {
  state = {
    page: 0,
    intents: [],
    displayIntents: [],
    filteredIntentsCount: 0
  }

  apiClient = new ApiClient(this.props.axios)

  async fetchData() {
    const intents = await this.apiClient.getIntents()
    this.setState({ intents, filteredIntentsCount: intents.length }, this.updateDisplayIntents)
  }

  updateDisplayIntents = () => {
    const { page, intents } = this.state
    const filteredIntents = intents
      // TODO: filtering
      .filter(x => x)
    const filteredIntentsCount = filteredIntents.length
    const displayIntents = filteredIntents.slice(page * ITEMS_PER_PAGE, (page + 1) * ITEMS_PER_PAGE)
    this.setState({ filteredIntentsCount, displayIntents })
  }

  async componentDidMount() {
    await this.fetchData()
  }

  renderPagination() {
    const pagesCount = Math.ceil(this.state.filteredIntentsCount / ITEMS_PER_PAGE)

    return (
      <Pager
        pagesCount={pagesCount}
        currentPage={this.state.page}
        goTo={this.updateDisplayIntents}
      />
    )
  }

  renderHeader() {
    return null
  }

  renderListItem = (intent: Intent, isSelected?: boolean) => {
    if (!intent || !intent.name) {
      return null
    }

    const { language } = this.props

    const utterances = intent.utterances[language] || []

    const title = utterances.length
      ? utterances[0]
      : intent.name
        .split("_")
        .slice(1)
        .join(" ")

    return (
      <Card
        key={intent.name}
        interactive={!isSelected}
        onClick={isSelected ? null : () => {
          this.props.onSelect(intent.name)
        }}
        className={classnames(style.card, {
          [style.selectedCard]: isSelected
        })}
      >
        <h5>
          Q:&nbsp;{title}&nbsp;<VariationsOverlay elements={utterances} />
        </h5>

        {
          isSelected && <Button onClick={() => {
            this.props.onSelect(null)
          }} icon="undo">Select another</Button>
        }
      </Card >
    )
  };

  renderList() {
    const { displayIntents } = this.state

    if (displayIntents.length) {
      return displayIntents.map(item => this.renderListItem(item))
    }

    return <h3>No intents match the query.</h3>
  }

  render() {
    const { selected: selectedItemName } = this.props
    const selectedItem = this.state.intents.find(intent => intent.name === selectedItemName)

    if (selectedItemName && !selectedItem) {
      return null
    }

    if (selectedItem) {
      return this.renderListItem(selectedItem, true)
    }

    return (
      <>
        {this.renderHeader()}
        {this.renderPagination()}
        {this.renderList()}
        {this.renderPagination()}
      </>
    )
  }

}

export default IntentPicker
