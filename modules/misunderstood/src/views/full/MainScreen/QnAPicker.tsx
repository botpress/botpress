import { Card, Popover, PopoverInteractionKind, PopoverPosition } from "@blueprintjs/core"
import { AxiosStatic } from "axios"
import { ElementPreview } from "botpress/utils"
import classnames from "classnames"
import React from "react"

import style from './style.scss'
import Pager from "./Pager"
import ApiClient from "./QnAApiClient"

const ITEMS_PER_PAGE = 2

interface Props {
  axios: AxiosStatic
  language: string
  selected: string
  onSelect: (id: string) => void
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
  filterCategories: { label: string; value: string }[]
  filterQuestion: string
  page: number
  items: QnAItem[],
  selectedItem: QnAItem | null
}

class QnAPicker extends React.Component<Props, State> {
  state = {
    overallItemsCount: 0,
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

  renderHeader() {
    return null
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
        interactive
        onClick={() => {
          this.props.onSelect(id)
        }}
        className={classnames(style.card, {
          [style.selectedCard]: isSelected
        })}
      >
        <h5>
          Q: {title} {this.renderVariationsOverlay(questions)}
        </h5>

        {answers[0] && (
          <p>
            A: {answers[0]}
            {this.renderVariationsOverlay(answers)}
          </p>
        )}
      </Card>
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
    await this.fetchData()
  }

  async componentDidUpdate(prevProps: Props) {
    if (prevProps.selected !== this.props.selected) {
      await this.fetchData()
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
