import React from 'react'
import { ListGroupItem, Glyphicon, Button, Modal } from 'react-bootstrap'
import { InputElement } from './InputElement'
import classnames from 'classnames'
import CreateOrEditModal from '../../Content/CreateOrEditModal'
import style from './style.scss'

export default class ElementsList extends React.Component {
  elementInputRef = React.createRef()
  state = {
    contentTypes: [],
    itemData: null,
    itemContentType: null,
    pickingContentType: false,
    inputValue: '',
    error: undefined,
    editElementIndex: undefined
  }

  componentDidMount() {
    this.props.bp.axios.get(`/content/types`)
      .then(({ data }) => {
        this.setState({ contentTypes: data || [] })
      })
  }

  getContentTypeById(id) {
    return this.state.contentTypes.find(x => x.id === id)
  }

  calculatePreview = async (contentType, formData) => {
    return await this.props.bp.axios.post(`/content/preview`, {
      contentType: contentType,
      formData: JSON.stringify(formData)
    })
  }

  handleOpenContentTypeChooser = event => {
    this.setState({ pickingContentType: true })
  }

  handleCloseContentTypeChooser = event => {
    this.setState({ pickingContentType: false })
  }

  handleFormEdited = data => {
    this.setState({ itemData: data })
  }

  handleNewContent = async () => {
    const { itemContentType, itemData } = this.state;
    const preview = (await this.calculatePreview(itemContentType.id, itemData)).data;
    if (this.state.editElementIndex != undefined) {
      this.props.onUpdate({ preview: preview, formData: itemData, contentTypeId: itemContentType.id },
        this.state.editElementIndex)
      this.setState({ editElementIndex: undefined })
    } else {
      this.props.onCreate({ preview: preview, formData: itemData, contentTypeId: itemContentType.id })
    }
    this.setState({ itemData: null, itemContentType: null })
  }

  handleCloseContent = event => {
    this.setState({ itemContentType: null, itemData: null, editElementIndex: undefined })
  }

  renderContentTypePicker() {
    const { contentTypes } = this.state
    return (
      <div>
        <div className="list-group">
          {contentTypes.filter(cat => !cat.hidden).map((contentType, i) => (
            <a
              href="#"
              key={i}
              onClick={() => this.setState({ itemContentType: contentType, itemData: null, pickingContentType: false })}
              className={classnames('list-group-item', 'list-group-item-action', {
                active: i === this.state.activeItemIndex
              })}
            >
              {contentType.title}
            </a>
          ))}
        </div>
      </div >
    )
  }

  editContent = index => {
    this.setState({
      editElementIndex: index,
      itemData: this.props.elements[index].formData,
      itemContentType: this.getContentTypeById(this.props.elements[index].contentTypeId)
    })
  }

  toggleEditMode = index => {
    this.setState({ editElementIndex: index })
  }

  handleNewElement = (element, index) => {
    this.setState({ editElementIndex: undefined })
    this.props.onUpdate(element, index)
  }

  renderElement = (element, index) => {
    if (typeof element == 'string' && this.state.editElementIndex === index) {
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
          {
            typeof element == 'string' ?
              <a className={style.listElementValue} onClick={() => this.toggleEditMode(index)}>
                {element}
              </a>
              :
              <a className={style.listElementValue} onClick={() => this.editContent(index)}>
                {element.preview}
              </a>
          }
          <Glyphicon glyph="trash" onClick={() => this.props.onDelete(index)} className={style.listElementIcon} />
        </ListGroupItem>
      )
    }
  }

  render() {
    const multilineHint = this.props.allowMultiline ? ' Use ALT+Enter for a new line' : ''
    const schema = (this.state.itemContentType || {}).schema || { json: {}, ui: {} }
    return (
      <div>
        <CreateOrEditModal
          show={!!this.state.itemContentType}
          schema={schema.json}
          uiSchema={schema.ui}
          handleClose={this.handleCloseContent}
          formData={this.state.itemData}
          handleEdit={this.handleFormEdited}
          handleCreateOrUpdate={this.handleNewContent}
        />
        <Modal show={this.state.pickingContentType} onHide={this.handleCloseContentTypeChoose}>
          <Modal.Header closeButton>
            <Modal.Title>Select a Content Type</Modal.Title>
          </Modal.Header>

          <Modal.Body>
            {this.renderContentTypePicker()}
          </Modal.Body>

          <Modal.Footer>
            <Button onClick={this.handleCloseContentTypeChooser} variant="secondary">Cancel</Button>
          </Modal.Footer>
        </Modal>


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
