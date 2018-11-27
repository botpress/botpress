import React, { Component } from 'react'
import Dropzone from 'react-dropzone'
import {
  Table,
  Row,
  Col,
  Button,
  Panel,
  FormControl,
  Form,
  Tooltip,
  OverlayTrigger,
  FormGroup,
  InputGroup
} from 'react-bootstrap'
import style from './style.scss'

export default class KnowledgeManager extends Component {
  constructor(props) {
    super(props)

    this.downloadLink = React.createRef()
    this.dropzoneRef = React.createRef()
    this.acceptedMimeTypes = 'text/plain,application/pdf'

    this.state = {
      uploadProgression: 0,
      isUploading: false
    }
  }

  componentDidMount() {
    this.fetchDocuments()
  }

  fetchDocuments() {
    this.props.bp.axios.get('mod/knowledge/list').then(({ data }) => {
      this.setState({ documents: data })
    })
  }

  onFilesDropped = async files => {
    if (this.state.isUploading) {
      return
    }

    const formData = new FormData()
    files.map(file => formData.append('file', file))

    await this.props.bp.axios.post('/mod/knowledge/upload', formData, {
      onUploadProgress: progress => {
        this.setState({
          isUploading: true,
          uploadProgression: Math.round((progress.loaded / progress.total) * 100)
        })
      }
    })

    this.setState({ isUploading: false })
    this.fetchDocuments()
  }

  downloadDocument = doc => {
    this.props.bp.axios({ method: 'get', url: `/mod/knowledge/view/${doc}d`, responseType: 'blob' }).then(response => {
      this.setState(
        {
          downloadLinkHref: window.URL.createObjectURL(new Blob([response.data])),
          downloadLinkFileName: /filename=(.*\.*?)/.exec(response.headers['content-disposition'])[1]
        },
        () => this.downloadLink.current.click()
      )
    })
  }

  deleteDocument = async doc => {
    if (confirm(`Do you really want to delete the document "${doc}"?`)) {
      await this.props.bp.axios.get(`/mod/knowledge/delete/${doc}`)
      this.fetchDocuments()
    }
  }

  syncIndex = async () => {
    await this.props.bp.axios.get(`/mod/knowledge/sync`)
  }

  sendQuery = async () => {
    const { data } = await this.props.bp.axios.get('/mod/knowledge/query', {
      params: { q: this.state.knowledgeTestField }
    })

    this.setState({
      testResults: data
    })
  }

  onQueryChanged = event => {
    this.setState({
      knowledgeTestField: event.target.value
    })
  }

  onInputKeyPress = e => {
    if (e.key === 'Enter') {
      this.sendQuery()
    }
  }

  renderFileList() {
    return (
      <div>
        <h3>Indexed documents</h3>
        <Table size="sm">
          <thead>
            <tr>
              <th>Filename</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {this.state.documents &&
              this.state.documents.map(doc => (
                <tr key={doc}>
                  <td>
                    <a href="#" onClick={() => this.downloadDocument(doc)}>
                      {doc}
                    </a>
                  </td>
                  <td>
                    <a href="#" onClick={() => this.deleteDocument(doc)}>
                      Delete
                    </a>
                  </td>
                </tr>
              ))}
          </tbody>
        </Table>
      </div>
    )
  }

  renderUploadZone() {
    const tooltip = (
      <Tooltip id="tooltip">
        Supported file types: <strong>{this.acceptedMimeTypes}</strong>
      </Tooltip>
    )

    return (
      <div>
        <h3>Index new documents</h3>
        Drag & drop your documents below or click on the
        <br /> "Select files" button &nbsp;
        <OverlayTrigger placement="right" overlay={tooltip}>
          <Button bsSize="xs">?</Button>
        </OverlayTrigger>
        <br />
        <br />
        <Dropzone
          ref={this.dropzoneRef}
          accept={this.acceptedMimeTypes}
          onDrop={this.onFilesDropped}
          className={style.dropzone}
          overlay={tooltip}
        />
        {this.state.isUploading ? `Uploading: ${this.state.uploadProgression} %` : ''}
        <br />
        <Button onClick={() => this.dropzoneRef.current.open()}>Select files</Button>
      </div>
    )
  }

  renderSync() {
    return (
      <div>
        <h3>Synchronization</h3>
        Documents are automatically synchronized when added from this interface. Manual sync is required when added
        manually
        <br />
        <br />
        Last sync date: Never
        <br />
        <br />
        <Button onClick={this.syncIndex} bsStyle="success">
          Sync now
        </Button>
      </div>
    )
  }

  renderTestKnowledge() {
    return (
      <Row>
        <Col md={4}>
          <div>
            <h3>Test Knowledgebase</h3>
            Type some text and see what would be the most probable answer from your bot
            <br />
            <FormGroup>
              <InputGroup>
                <FormControl
                  value={this.state.knowledgeTestField}
                  onChange={this.onQueryChanged}
                  onKeyPress={this.onInputKeyPress}
                  placeholder="Question"
                  style={{ width: 400 }}
                />
                &nbsp;
                <Button onClick={this.sendQuery}>Send</Button>
              </InputGroup>
            </FormGroup>
          </div>
        </Col>
        <Col md={7}>{this.renderResults()}</Col>
      </Row>
    )
  }

  renderResults() {
    return (
      <div>
        <h3>Results</h3>
        {this.state.testResults && this.state.testResults.map(r => this.renderResult(r))}
      </div>
    )
  }

  renderResult(result) {
    const { name, paragraph, page } = result.snippet
    return (
      <div>
        {result.snippet.content}
        <br />
        <small>
          Confidence: <strong>{result.confidence}</strong> - page {page}, paragraph: {paragraph} in file {name}
        </small>
        <hr />
      </div>
    )
  }

  render() {
    return (
      <Panel>
        <a ref={this.downloadLink} href={this.state.downloadLinkHref} download={this.state.downloadLinkFileName} />
        <Panel.Body>
          {this.renderTestKnowledge()}
          <Row>
            <Col>
              <hr />
            </Col>
          </Row>
          <Row>
            <Col md={4} xs={12}>
              {this.renderFileList()}
            </Col>
            <Col md={3} xs={12}>
              {this.renderUploadZone()}
            </Col>
            <Col md={3} xs={12}>
              {this.renderSync()}
            </Col>
          </Row>
        </Panel.Body>
      </Panel>
    )
  }
}
