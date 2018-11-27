import React, { Component } from 'react'

import FileList from './components/FileList'
import QueryTester from './components/QueryTester'
import Uploader from './components/Uploader'
import Synchronize from './components/Synchronize'
import { Row, Col, Panel } from 'react-bootstrap'

export default class KnowledgeManager extends Component {
  constructor(props) {
    super(props)

    this.downloadLink = React.createRef()

    this.state = {
      uploadProgression: 0,
      isUploadInProgress: false,
      isQueryInProgress: false,
      isSyncInProgress: false,
      isSyncError: false,
      lastSyncTimestamp: undefined,
      acceptedMimeTypes: ''
    }
  }

  componentDidMount() {
    this.fetchDocuments()
    this.fetchStatus()
  }

  fetchStatus = () => {
    this.props.bp.axios.get('mod/knowledge/status').then(({ data }) => {
      this.setState({
        lastSyncTimestamp: data.lastSyncTimestamp && parseInt(data.lastSyncTimestamp),
        acceptedMimeTypes: data.acceptedMimeTypes && data.acceptedMimeTypes.join(',')
      })
    })
  }

  fetchDocuments = () => {
    this.props.bp.axios.get('mod/knowledge/list').then(({ data }) => {
      this.setState({ documents: data.map(doc => ({ id: doc, filename: doc })) })
    })
  }

  handleViewDocument = doc => {
    this.props.bp.axios({ method: 'get', url: `/mod/knowledge/view/${doc}`, responseType: 'blob' }).then(response => {
      this.setState(
        {
          downloadLinkHref: window.URL.createObjectURL(new Blob([response.data])),
          downloadLinkFileName: /filename=(.*\.*?)/.exec(response.headers['content-disposition'])[1]
        },
        () => this.downloadLink.current.click()
      )
    })
  }

  handleDeleteDocument = async doc => {
    if (confirm(`Do you really want to delete the document "${doc}"?`)) {
      await this.props.bp.axios.get(`/mod/knowledge/delete/${doc}`)
      this.fetchDocuments()
    }
  }

  handleDeleteSelected = async documents => {
    if (confirm(`Do you really want to delete ${documents.length} documents?`)) {
      await this.props.bp.axios.post(`/mod/knowledge/bulk_delete`, documents)
      this.fetchDocuments()
    }
  }

  handleFileUpload = async files => {
    const formData = new FormData()
    files.map(file => formData.append('file', file))

    this.setState({ uploadStatus: 'Upload in progress...', isUploadError: false })

    this.props.bp.axios
      .post('/mod/knowledge/upload', formData, {
        onUploadProgress: progress => {
          this.setState({
            isUploadInProgress: true,
            uploadProgression: Math.round((progress.loaded / progress.total) * 100)
          })
        }
      })
      .then(() => {
        this.setState({ uploadStatus: `Upload successful!`, isUploadInProgress: false })
        this.clearWithDelay('uploadStatus')
        this.fetchDocuments()
      })
      .catch(err => {
        this.setState({
          uploadStatus: `There was an error while uploading files: ${err}`,
          isUploadError: true,
          isUploadInProgress: false
        })
        this.clearWithDelay('uploadStatus')
      })
  }

  handleQuerySearch = async queryText => {
    if (this.state.isQueryInProgress) {
      return
    }
    this.setState({ isQueryInProgress: true })

    this.props.bp.axios
      .get('/mod/knowledge/query', {
        params: { q: queryText }
      })
      .then(({ data }) =>
        this.setState({
          queryResults: data,
          isQueryInProgress: false
        })
      )
      .catch(err => {
        this.setState({ isQueryInProgress: false })
      })
  }

  handleSynchronize = async () => {
    if (!this.state.isSyncInProgress) {
      this.setState({ syncMessage: 'Synchronization in progress...', isSyncError: false })

      this.props.bp.axios
        .get(`/mod/knowledge/sync`)
        .then(() => {
          this.setState({ syncMessage: 'Synchronization completed successfully' })
          this.clearWithDelay('syncMessage')
          this.fetchStatus()
        })
        .catch(() => {
          this.setState({
            syncMessage: `There was an eror while synchronizing. Please check the logs`,
            isSyncError: true
          })
          this.clearWithDelay('syncMessage')
        })
    }
  }

  clearWithDelay = field => {
    window.setTimeout(() => {
      this.setState({ [field]: undefined })
    }, 2500)
  }

  render() {
    return (
      <Panel>
        <a ref={this.downloadLink} href={this.state.downloadLinkHref} download={this.state.downloadLinkFileName} />
        <Panel.Body>
          <QueryTester
            onQuerySearch={this.handleQuerySearch}
            onView={this.handleViewDocument}
            queryInProgress={this.state.isQueryInProgress}
            queryResults={this.state.queryResults}
          />
          <Row>
            <Col>
              <hr />
            </Col>
          </Row>
          <Row>
            <Col md={5} xs={12}>
              <FileList
                data={this.state.documents}
                onDelete={this.handleDeleteDocument}
                onView={this.handleViewDocument}
                onRefresh={this.fetchDocuments}
                onDeleteSelected={this.handleDeleteSelected}
              />
            </Col>
            <Col md={3} xs={12}>
              <Uploader
                mimeTypes={this.state.acceptedMimeTypes}
                onRefresh={this.fetchDocuments}
                onUpload={this.handleFileUpload}
                isUploading={this.state.isUploadInProgress}
                uploadProgress={this.state.uploadProgression}
                status={this.state.uploadStatus}
                isError={this.state.isUploadError}
              />
            </Col>
            <Col md={3} xs={12}>
              <Synchronize
                onSync={this.handleSynchronize}
                lastSyncTimestamp={this.state.lastSyncTimestamp}
                isSyncInProgress={this.state.isSyncInProgress}
                status={this.state.syncMessage}
                isError={this.state.isSyncError}
              />
            </Col>
          </Row>
        </Panel.Body>
      </Panel>
    )
  }
}
