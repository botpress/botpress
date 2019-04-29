import React from 'react'
import { ListGroupItem, Glyphicon, Button } from 'react-bootstrap'
import { InputElement } from './InputElement'
import Widget from '../../Content/Select'
import style from './style.scss'
import ContentPickerWidget from '../../Content/Select/Widget'

export default class ElementsList extends React.Component {
  elementInputRef = React.createRef()
  state = {
    pickingContentType: false,
    inputValue: '',
    error: undefined,
    editElementIndex: undefined
  }

  handleOpenContentTypeChooser = event => {
    this.setState({ pickingContentType: true })
  }

  handleCloseContentTypeChooser = event => {
    this.setState({ pickingContentType: false, editElementIndex: undefined })
  }

  handlePickContent = async item => {
    item.id && this.props.onCreate({ contentId: item.id })
    this.setState({ editElementIndex: undefined })
  }

  onContentChange = item => {
    item.id && this.props.onUpdate({ contentId: item.id }, this.state.editElementIndex)
    this.setState({ editElementIndex: undefined })
  }

  toggleEditMode = index => {
    this.setState({ editElementIndex: index })
  }

  handleNewElement = (element, index) => {
    this.setState({ editElementIndex: undefined })
    this.props.onUpdate(element, index)
  }

  renderElement = (element, index) => {
    if (!element.contentId && this.state.editElementIndex === index) {
      return (
        <InputElement
          key={`elements_edit_element_${index}`}
          defaultValue={element}
          allowMultiline={this.props.allowMultiline}
          elements={this.props.elements.filter(el => el !== element)}
          onElementAdd={element => this.handleNewElement(element, index)}
        />
      )
    } else {
      return (
        <ListGroupItem key={`elements_create_element_${index}`} className={style.listElement}>
          {element.contentId ? (
            <ContentPickerWidget
              className={style.contentPickerWidget}
              itemId={element.contentId}
              onClickChange={() => this.toggleEditMode(index)}
              onChange={this.onContentChange}
              onDelete={() => this.props.onDelete(index)}
            />
          ) : (
            <React.Fragment>
              <a className={style.listElementValue} onClick={() => this.toggleEditMode(index)}>
                {element}
              </a>
              <Glyphicon glyph="trash" onClick={() => this.props.onDelete(index)} className={style.listElementIcon} />
            </React.Fragment>
          )}
        </ListGroupItem>
      )
    }
  }

  render() {
    const multilineHint = this.props.allowMultiline ? ' Use ALT+Enter for a new line' : ''
    return (
      <div ref={this.elementInputRef}>
        {this.state.pickingContentType ? (
          <Widget
            show={this.state.pickingContentType}
            onClose={this.handleCloseContentTypeChooser}
            onSelect={this.handlePickContent}
            container={document.getElementsByTagName('body')[0]}
          />
        ) : null}
        <div className={style.qnaAnswersInput}>
          <div className={style.qnaAnswersInputContent}>
            <Button type="button" onClick={this.handleOpenContentTypeChooser}>
              <Glyphicon glyph="plus" /> Content
            </Button>
          </div>
          <div className={style.qnaAnswersInputText}>
            <InputElement
              placeholder={this.props.placeholder || 'Type and press enter to create an element.' + multilineHint}
              onInvalid={this.props.onInvalid}
              cleanInputAfterEnterPressed={true}
              allowMultiline={this.props.allowMultiline}
              elements={this.props.elements}
              onElementAdd={this.props.onCreate}
            />
          </div>
        </div>
        {this.props.elements && this.props.elements.map((element, index) => this.renderElement(element, index))}
      </div>
    )
  }
}
