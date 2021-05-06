import { Button, Card, ControlGroup, InputGroup, MenuItem } from '@blueprintjs/core'
import { MultiSelect } from '@blueprintjs/select'
import { AxiosStatic } from 'axios'
import { lang } from 'botpress/shared'
import classnames from 'classnames'
import React from 'react'

import Pager from './Pager'
import ApiClient from './QnAApiClient'
import style from './style.scss'
import VariationsOverlay from './VariationsOverlay'

const ITEMS_PER_PAGE = 5

interface Props {
  axios: AxiosStatic
  language: string
  selected: string
  onSelect: (id: string | null) => void
}

interface QnAItem {
  id: string
  data: {
    action: string
    answers: {
      [lang: string]: string[]
    }
    category: string
    enabled: boolean
    questions: {
      [lang: string]: string[]
    }
  }
}

interface State {
  overallItemsCount: number
  categoryOptions: string[]
  filterCategories: string[]
  filterQuestion: string
  page: number
  items: QnAItem[]
  selectedItem: QnAItem | null
}

const StringMultiSelect = MultiSelect.ofType<string>()

class QnAPicker extends React.Component<Props, State> {
  state = {
    overallItemsCount: 0,
    categoryOptions: [],
    filterCategories: [],
    filterQuestion: '',
    page: 0,
    items: [],
    selectedItem: null
  }

  apiClient = new ApiClient(this.props.axios)

  fetchData = async (page = 0) => {
    const { filterQuestion, filterCategories } = this.state
    const { selected: selectedItemId } = this.props

    if (selectedItemId) {
      const data = await this.apiClient.getQuestion(selectedItemId)

      this.setState({
        selectedItem: data
      })
    } else {
      this.setState({
        selectedItem: null
      })
    }

    const data = await this.apiClient.getQuestions({
      page,
      pageSize: ITEMS_PER_PAGE,
      question: filterQuestion,
      categories: filterCategories
    })

    this.setState({
      items: data.items,
      overallItemsCount: data.count,
      page
    })
  }

  fetchCategories = async () => {
    const categoryOptions = await this.apiClient.getCategories()
    this.setState({ categoryOptions })
  }

  renderPagination() {
    const pagesCount = Math.ceil(this.state.overallItemsCount / ITEMS_PER_PAGE)

    return <Pager pagesCount={pagesCount} currentPage={this.state.page} goTo={this.fetchData} />
  }

  handleFilterChange = event => {
    this.setState(
      {
        filterQuestion: event.target.value
      },
      async () => {
        await this.fetchData()
      }
    )
  }

  handleCategorySelect = (category: string) => {
    this.setState(
      ({ filterCategories }) => {
        if (filterCategories.includes(category)) {
          filterCategories = filterCategories.filter(c => c !== category)
        } else {
          filterCategories = [...filterCategories, category].sort()
        }
        return { filterCategories }
      },
      async () => {
        await this.fetchData()
      }
    )
  }

  renderHeader() {
    return (
      <ControlGroup className={style.filter}>
        <InputGroup
          large
          leftIcon="filter"
          onChange={this.handleFilterChange}
          placeholder={lang.tr('module.misunderstood.searchForAQuestion')}
          value={this.state.filterQuestion}
        />

        {this.state.categoryOptions && !!this.state.categoryOptions.length && (
          <StringMultiSelect
            items={this.state.categoryOptions}
            selectedItems={this.state.filterCategories}
            onItemSelect={this.handleCategorySelect}
            placeholder={lang.tr('module.misunderstood.searchForACategory')}
            popoverProps={{
              minimal: true
            }}
            tagRenderer={category => category}
            itemRenderer={(category, { modifiers, handleClick }) => {
              if (!modifiers.matchesPredicate) {
                return null
              }
              return <MenuItem active={modifiers.active} onClick={handleClick} key={category} text={category} />
            }}
            tagInputProps={{
              onRemove: this.handleCategorySelect,
              large: true,
              inputProps: {
                className: style.selectInput
              }
            }}
          />
        )}
      </ControlGroup>
    )
  }

  renderListItem = (item: QnAItem, isSelected?: boolean) => {
    if (!item || !item.id) {
      return null
    }

    const { language } = this.props
    const { id, data } = item

    const questions = data.questions[language] || []
    const answers = data.answers[language] || []

    const title = questions.length
      ? questions[0]
      : id
          .split('_')
          .slice(1)
          .join(' ')

    return (
      <Card
        key={id}
        interactive={!isSelected}
        onClick={
          isSelected
            ? null
            : () => {
                this.props.onSelect(id)
              }
        }
        className={classnames(style.card, {
          [style.selectedCard]: isSelected
        })}
      >
        <h5>
          Q:&nbsp;{title}&nbsp;
          <VariationsOverlay elements={questions} axios={this.props.axios} language={this.props.language} />
        </h5>

        {answers[0] && (
          <p>
            A:&nbsp;{answers[0]}
            <VariationsOverlay elements={answers} axios={this.props.axios} language={this.props.language} />
          </p>
        )}

        {data.category && (
          <p>
            {lang.tr('module.misunderstood.category')}:&nbsp;{data.category}
          </p>
        )}

        {isSelected && (
          <Button
            onClick={() => {
              this.props.onSelect(null)
            }}
            icon="undo"
          >
            {lang.tr('module.misunderstood.selectAnother')}
          </Button>
        )}
      </Card>
    )
  }

  renderList() {
    const { items, filterQuestion, filterCategories } = this.state

    if (items.length) {
      return items.map(item => this.renderListItem(item))
    }

    return (
      <h3>
        {filterQuestion || filterCategories.length
          ? lang.tr('module.misunderstood.noQuestionsMatchQuery')
          : lang.tr('module.misunderstood.noQuestionsFound')}
      </h3>
    )
  }

  async componentDidMount() {
    await Promise.all([this.fetchData(), this.fetchCategories()])
  }

  async componentDidUpdate(prevProps: Props) {
    if (prevProps.selected !== this.props.selected) {
      await this.fetchData(this.state.page)
    }
  }

  render() {
    const { selectedItem } = this.state
    const { selected: selectedItemId } = this.props

    if (selectedItemId && !selectedItem) {
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

export default QnAPicker
