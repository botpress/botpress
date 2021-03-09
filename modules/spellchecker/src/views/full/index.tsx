import { AxiosInstance } from 'axios'
// import { Container } from 'botpress/ui'
import React,{useState} from 'react'

interface Props {
  bp: { axios: AxiosInstance }
  contentLang: string
}

interface State {
  input:string
  result:string
}

export default class SpellCheckerUI extends React.Component<Props, State> {
  const [result, setResult] = useState('')
  const [input, setInput] = useState('')

  const correct = async (text:string) =>{
      const axiosConfig = bp.http.getAxiosConfigForBot(event.botId)
      const result = await this.props.bp.axios.post(`/mod/nlu/extract`, { text }, axiosConfig)
    
  }
  render() {
    return (
      // <Container sidePanelHidden={true} yOverflowScroll={true}>
        // <div />
        <div className="bph-layout-main">
          <div className="bph-layout-middle">
            <input type="text" placeholder="userPostId" ref="userPostId" /> <br />
            <button type="button" className="btn btn-success" onClick={this.correct}></button>
            <div></div>
          </div>
        </div>
      // </Container>
    )
  }
}
