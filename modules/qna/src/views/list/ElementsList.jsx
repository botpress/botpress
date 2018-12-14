import React from 'react'
import { ListGroupItem, Glyphicon } from 'react-bootstrap'
import { InputElement } from './InputElement'
import style from './style.scss'

export class ElementsList extends React.Component {
  elementInputRef = React.createRef()
  state = {
    inputValue: '',
    error: undefined,
    elements: [],
    editElementIndex: undefined
  }

  createElement = element => {
    this.setState({ elements: [...this.state.elements, element] }, this.onElementsChange)
  }

  updateElement = (element, index) => {
    const elements = this.state.elements
    if (elements[index]) {
      elements[index] = element
      this.setState({ elements, editElementIndex: undefined }, this.onElementsChange)
    }
  }

  deleteElement = index => {
    const elements = this.state.elements

    if (elements[index]) {
      elements.splice(index, 1)
      this.setState({ elements }, this.onElementsChange)
    }
  }

  toggleEditMode = index => {
    this.setState({ editElementIndex: index })
  }

  onElementsChange = () => {
    this.props.onElementsChange && this.props.onElementsChange(this.state.elements)
  }

  renderElement = (element, index) => {
    if (this.props.renderElement) {
      return this.props.renderElement(element)
    }

    if (this.state.editElementIndex === index) {
      return (
        <InputElement
          key={`elements_edit_element_${index}`}
          defaultValue={element}
          elements={this.state.elements}
          onEnter={element => this.updateElement(element, index)}
        />
      )
    } else {
      return (
        <ListGroupItem key={`elements_create_element_${index}`} className={style.listElement}>
          <div className={style.listElementValue}>{element}</div>
          <Glyphicon glyph="pencil" onClick={() => this.toggleEditMode(index)} className={style.listElementIcon} />
          <Glyphicon glyph="trash" onClick={() => this.deleteElement(index)} className={style.listElementIcon} />
        </ListGroupItem>
      )
    }
  }

  render() {
    return (
      <div>
        <InputElement
          placeholder="Type and press enter to create an element"
          eraseValue={true}
          elements={this.state.elements}
          onEnter={this.createElement}
        />
        {this.state.elements.map((element, index) => this.renderElement(element, index))}
      </div>
    )
  }
}
