import { Button, Card, ControlGroup, InputGroup, MenuItem, Popover, PopoverInteractionKind, PopoverPosition } from "@blueprintjs/core"
import { MultiSelect } from '@blueprintjs/select'
import { AxiosStatic } from "axios"
import { ElementPreview } from "botpress/utils"
import classnames from "classnames"
import React from "react"

import style from './style.scss'
import Pager from "./Pager"
import ApiClient from "./QnAApiClient"

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
    action: string;
    answers: {
      [lang: string]: string[];
    };
    category: string;
    enabled: boolean;
    questions: {
      [lang: string]: string[];
    };
  }
}

interface State {
  overallItemsCount: number
  categoryOptions: string[]
  filterCategories: string[]
  filterQuestion: string
  page: number
  items: QnAItem[],
  selectedItem: QnAItem | null
}

const StringMultiSelect = MultiSelect.ofType<string>()

class QnAPicker extends React.Component<Props, State> {
  state = {
    overallItemsCount: 0,
    categoryOptions: [],
    filterCategories: [],
    filterQuestion: "",
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
  };

  fetchCategories = async () => {
    const categoryOptions = await this.apiClient.getCategories()
    this.setState({ categoryOptions })
  }

  renderPagination() {
    const pagesCount = Math.ceil(this.state.overallItemsCount / ITEMS_PER_PAGE)

    return (
      <Pager
        pagesCount={pagesCount}
        currentPage={this.state.page}
        goTo={this.fetchData}
      />
    )
  }

  handleFilterChange = (event) => {
    this.setState({
      filterQuestion: event.target.value
    }, async () => {
      await this.fetchData()
    })
  }

  handleCategorySelect = (category: string) => {
    this.setState(({ filterCategories }) => {
      if (filterCategories.includes(category)) {
        filterCategories = filterCategories.filter(c => c !== category)
      } else {
        filterCategories = [...filterCategories, category].sort()
      }
      return { filterCategories }
    }, async () => {
      await this.fetchData()
    })
  }

  renderHeader() {
    return <ControlGroup className={style.filter}>
      <InputGroup
        large
        leftIcon="filter"
        onChange={this.handleFilterChange}
        placeholder="Search for a question..."
        value={this.state.filterQuestion}
      />

      {this.state.categoryOptions && !!this.state.categoryOptions.length &&
        <StringMultiSelect
          items={this.state.categoryOptions}
          selectedItems={this.state.filterCategories}
          onItemSelect={this.handleCategorySelect}
          placeholder="Search for a category..."
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
            onRemove: this.handleCategorySelect, large: true, inputProps: {
              className: style.selectInput
            }
          }}
        />
      }
    </ControlGroup>
  }

  renderVariationsOverlay = (elements: string[]) => {
    return (
      !!elements.length && (
        <Popover interactionKind={PopoverInteractionKind.HOVER} position={PopoverPosition.RIGHT}>
          <span>
            &nbsp;
            <strong>({elements.length})</strong>
          </span>
          <ul className={style.popover}>
            {elements.map(variation => (
              <li key={variation}>
                {variation.startsWith("#!") ? (
                  <ElementPreview itemId={variation.replace("#!", "")} />
                ) : (
                    variation
                  )}
              </li>
            ))}
          </ul>
        </Popover>
      )
    )
  };

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
        .split("_")
        .slice(1)
        .join(" ")

    return (
      <Card
        key={id}
        interactive={!isSelected}
        onClick={isSelected ? null : () => {
          this.props.onSelect(id)
        }}
        className={classnames(style.card, {
          [style.selectedCard]: isSelected
        })}
      >
        <h5>
          Q:&nbsp;{title}&nbsp;{this.renderVariationsOverlay(questions)}
        </h5>

        {answers[0] && (
          <p>
            A:&nbsp;{answers[0]}
            {this.renderVariationsOverlay(answers)}
          </p>
        )}

        {data.category && (
          <p>Category:&nbsp;{data.category}</p>
        )}

        {
          isSelected && <Button onClick={() => {
            this.props.onSelect(null)
          }} icon="undo">Select another</Button>
        }
      </Card >
    )
  };

  renderList() {
    const { items } = this.state

    if (items.length) {
      return this.state.items.map(item => this.renderListItem(item))
    }

    return <h3>No questions have been added yet.</h3>
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
