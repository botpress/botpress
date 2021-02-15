import { Button, Classes } from '@blueprintjs/core'
import { lang } from 'botpress/shared'
import c from 'classnames'
import React from 'react'
import { ListGroupItem } from 'react-bootstrap'

import Widget from '../../Content/Select'
import ContentPickerWidget from '../../Content/Select/Widget'

import { InputElement } from './InputElement'
import style from './style.scss'

interface Props {
  onUpdate: (id: string, index: number) => void
  allowMultiline: boolean
  elements: any
  placeholder?: string
  onInvalid: any
  onCreate: (id: string) => void
  onDelete: (index: number) => void
}

export default class ElementsList extends React.Component<Props> {
  elementInputRef = React.createRef()
  state = {
    inputValue: '',
    error: undefined,
    editElementIndex: undefined,
    showPicker: false
  }

  handlePickContent = async item => {
    this.props.onCreate(`#!${item.id}`)
    this.setState({ editElementIndex: undefined })
  }

  onContentChange = item => {
    this.props.onUpdate(`#!${item.id}`, this.state.editElementIndex)
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
    if (this.state.editElementIndex === index) {
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
          {element.startsWith('#!') ? (
            <ContentPickerWidget
              itemId={element.replace('#!', '')}
              onClickChange={() => this.toggleEditMode(index)}
              onChange={this.onContentChange}
            />
          ) : (
            <div style={{ padding: 6 }}>
              <a className={style.listElementValue} onClick={() => this.toggleEditMode(index)}>
                {element}
              </a>
            </div>
          )}
          <Button
            minimal={true}
            icon="trash"
            onClick={() => this.props.onDelete(index)}
            className={c(style.listElementIcon, Classes.FIXED)}
          />
        </ListGroupItem>
      )
    }
  }

  render() {
    const multilineHint = this.props.allowMultiline ? ' Use ALT+Enter for a new line' : ''
    return (
      <div style={{ width: '100%' }}>
        {this.state.showPicker && (
          <Widget
            show={this.state.showPicker}
            onClose={() => this.setState({ showPicker: false })}
            onSelect={this.handlePickContent}
            container={document.getElementsByTagName('body')[0]}
          />
        )}
        <div className={style.elementListInput}>
          <div className={style.contentButton}>
            <Button
              tabIndex={-1}
              text={lang.tr('studio.sideBar.content')}
              icon="add"
              type="button"
              onClick={() => this.setState({ showPicker: true })}
            />
          </div>
          <div className={style.textField}>
            <InputElement
              placeholder={this.props.placeholder || 'Type and press enter to create an element.' + multilineHint}
              tabIndex={1}
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
