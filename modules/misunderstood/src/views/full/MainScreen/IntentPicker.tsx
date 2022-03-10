import { Button, Card, ControlGroup, InputGroup, MenuItem } from '@blueprintjs/core'
import { MultiSelect } from '@blueprintjs/select'
import { AxiosStatic } from 'axios'
import { lang } from 'botpress/shared'
import classnames from 'classnames'
import { parseUtterance } from 'common/utterance-parser'
import without from 'lodash/without'
import React from 'react'

import { ApiFlaggedEvent } from '../../../types'

import ApiClient from './NLUApiClient'
import Pager from './Pager'
import style from './style.scss'
import VariationsOverlay from './VariationsOverlay'

const ITEMS_PER_PAGE = 5

interface Params {
  contexts?: string[]
}

interface Props {
  axios: AxiosStatic
  language: string
  event: ApiFlaggedEvent | null
  selected: string
  params: Params
  onSelect: (id: string | null) => void
  onParamsUpdate: (params?: object | null) => void
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
  displayIntents: Intent[]
  filterIntent: string
  filteredIntentsCount: number
}

const StringMultiSelect = MultiSelect.ofType<string>()

class IntentPicker extends React.Component<Props, State> {
  state = {
    page: 0,
    intents: [],
    displayIntents: [],
    filterIntent: '',
    filteredIntentsCount: 0
  }

  apiClient = new ApiClient(this.props.axios)

  async fetchData() {
    const intents = await this.apiClient.getIntents()
    this.setState({ intents, filteredIntentsCount: intents.length }, this.updateDisplayIntents)
  }

  updateDisplayIntents = (pageToNavigate = 0) => {
    const { page, intents, filterIntent } = this.state
    const usedPage = typeof pageToNavigate !== 'undefined' ? pageToNavigate : page
    const filteredIntents = intents.filter(intent => !filterIntent || intent.name.includes(filterIntent))
    const filteredIntentsCount = filteredIntents.length
    const displayIntents = filteredIntents.slice(usedPage * ITEMS_PER_PAGE, (usedPage + 1) * ITEMS_PER_PAGE)
    this.setState({ filteredIntentsCount, displayIntents, page: usedPage })
  }

  async componentDidMount() {
    await this.fetchData()
  }

  renderPagination() {
    const pagesCount = Math.ceil(this.state.filteredIntentsCount / ITEMS_PER_PAGE)

    return <Pager pagesCount={pagesCount} currentPage={this.state.page} goTo={this.updateDisplayIntents} />
  }

  handleFilterChange = event => {
    this.setState(
      {
        filterIntent: event.target.value
      },
      this.updateDisplayIntents
    )
  }

  renderHeader() {
    return (
      <ControlGroup className={style.filter}>
        <InputGroup
          large
          leftIcon="filter"
          onChange={this.handleFilterChange}
          placeholder={lang.tr('module.misunderstood.searchForAnIntent')}
          value={this.state.filterIntent}
        />
      </ControlGroup>
    )
  }

  renderParamsForm() {
    const { event, params, selected: selectedItemName } = this.props

    const eventContexts = event?.nluContexts || []
    const selectedItem = this.state.intents.find(intent => intent.name === selectedItemName)
    const newContexts = without(eventContexts, ...selectedItem.contexts)

    if (!newContexts.length) {
      return null
    }

    const toggleContext = (context: string) => {
      let contexts = (params && params.contexts) || []
      if (contexts.includes(context)) {
        contexts = contexts.filter(c => c !== context)
      } else {
        contexts = [...contexts, context]
      }
      this.props.onParamsUpdate({
        ...params,
        contexts
      })
    }

    return (
      <div className={style.paramsForm}>
        <h5>{lang.tr('module.misunderstood.addExtraContexts')}</h5>
        <StringMultiSelect
          items={newContexts}
          selectedItems={(params && params.contexts) || []}
          onItemSelect={toggleContext}
          placeholder={lang.tr('module.misunderstood.searchForAContext')}
          popoverProps={{
            minimal: true
          }}
          tagRenderer={context => context}
          itemRenderer={(context, { modifiers, handleClick }) => {
            if (!modifiers.matchesPredicate) {
              return null
            }
            return <MenuItem active={modifiers.active} onClick={handleClick} key={context} text={context} />
          }}
          tagInputProps={{
            onRemove: toggleContext,
            inputProps: {
              className: style.selectInput
            }
          }}
        />
      </div>
    )
  }

  renderListItem = (intent: Intent, isSelected?: boolean) => {
    if (!intent || !intent.name) {
      return null
    }

    const { language } = this.props

    const utterances = (intent.utterances[language] || []).map(u => parseUtterance(u).utterance)

    return (
      <Card
        key={intent.name}
        interactive={!isSelected}
        onClick={
          isSelected
            ? null
            : () => {
                this.props.onSelect(intent.name)
              }
        }
        className={classnames(style.card, {
          [style.selectedCard]: isSelected
        })}
      >
        <h5>{intent.name}</h5>

        {utterances[0] && (
          <p>
            U:&nbsp;{utterances[0]}&nbsp;
            <VariationsOverlay elements={utterances} axios={this.props.axios} language={this.props.language} />
          </p>
        )}

        {isSelected && (
          <>
            {this.renderParamsForm()}
            <Button
              onClick={() => {
                this.props.onSelect(null)
                this.props.onParamsUpdate(null)
              }}
              icon="undo"
            >
              {lang.tr('module.misunderstood.selectAnother')}
            </Button>
          </>
        )}
      </Card>
    )
  }

  renderList() {
    const { displayIntents, filterIntent } = this.state

    if (displayIntents.length) {
      return displayIntents.map(item => this.renderListItem(item))
    }

    return (
      <h3>
        {filterIntent
          ? lang.tr('module.misunderstood.noIntentsMatchQuery')
          : lang.tr('module.misunderstood.noIntentsFound')}
      </h3>
    )
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
