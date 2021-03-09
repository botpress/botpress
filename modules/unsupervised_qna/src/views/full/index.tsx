import { Button, Spinner } from '@blueprintjs/core'
import { AxiosInstance } from 'axios'
import { MainLayout, Textarea } from 'botpress/shared'
import React from 'react'
import style from './style.scss'

interface Props {
  bp: { axios: AxiosInstance; events: any }
  contentLang: string
}

class App extends React.Component<Props> {
  state = {
    corpus: '',
    loading: true
  }

  async componentDidMount() {
    const { data } = await this.props.bp.axios.get('/mod/unsupervised/corpus')
    this.setState({ corpus: data.corpus, loading: false })
  }

  onSubmit = () => {
    const { corpus } = this.state
    return this.props.bp.axios.post('/mod/unsupervised/corpus', {
      corpus
    })
  }

  render() {
    return (
      <MainLayout.Wrapper>
        <MainLayout.Toolbar tabs={[{ title: 'Corpus Question Answering', id: 'qa' }]} />
        <div className={style.content}>
          {this.state.loading && <Spinner />}
          {!this.state.loading && (
            <React.Fragment>
              <div>Enter a corpus</div>
              <div className={style.textareaWrapper}>
                <Textarea
                  className={style.textarea}
                  onChange={value => this.setState({ corpus: value })}
                  value={this.state.corpus}
                />
                <Button onClick={this.onSubmit}>Update corpus</Button>
              </div>
            </React.Fragment>
          )}
        </div>
      </MainLayout.Wrapper>
    )
  }
}
export default App
