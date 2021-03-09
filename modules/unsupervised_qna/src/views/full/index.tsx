import { AxiosInstance } from 'axios'
import React from 'react'

interface Props {
  bp: { axios: AxiosInstance; events: any }
  contentLang: string
}

class App extends React.Component<Props> {
  state = {
    corpus: ''
  }

  async componentDidMount() {
    const { data: corpus } = await this.props.bp.axios.get('/mod/unsupervised/corpus')
    this.setState({ corpus })
  }

  onSubmit = () => {
    const { corpus } = this.state
    return this.props.bp.axios.post('/mod/unsupervised/corpus', {
      corpus
    })
  }

  render() {
    return (
      <div>
        <div>
          <div>Corpus: </div>
          <textarea value={this.state.corpus} onChange={e => this.setState({ corpus: e.target.value })} />
        </div>
        <button onClick={this.onSubmit}>Submit</button>
      </div>
    )
  }
}
export default App
