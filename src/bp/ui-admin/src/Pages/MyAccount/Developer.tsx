import { Button, Classes, FormGroup, InputGroup, Intent, Tab, Tabs } from '@blueprintjs/core'
import { FormFields, lang, Dialog } from 'botpress/shared'
import { UserProfile } from 'common/typings'
import React, { FC, useEffect, useState } from 'react'
import api from '~/api'
import { toastFailure, toastSuccess } from '~/utils/toaster'

interface Props {
  isOpen: boolean
  profile: UserProfile
  close: () => void
}

const Developer: FC<Props> = props => {
  const [apiKey, setApiKey] = useState<string>()
  const [payload, setPayload] = useState("{ email: '', strategy: '', apiKey: '' }")
  const [tab, setTab] = useState<any>('apiKey')

  useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    getKey()
  }, [props.isOpen])

  useEffect(() => {
    if (props.profile && apiKey) {
      const { email, strategy } = props.profile
      const example = { email, strategy, apiKey }
      setPayload(JSON.stringify(example, undefined, 2))
    }
  }, [apiKey])

  const getKey = async () => {
    try {
      const { data } = await api.getSecured().get('/auth/apiKey')
      setApiKey(data.apiKey)
    } catch (err) {
      toastFailure(lang.tr('admin.errorUpdatingProfile', { msg: err.message }))
    }
  }

  const resetKey = async event => {
    event.preventDefault()

    try {
      const { data } = await api.getSecured().post('/auth/resetApiKey')
      setApiKey(data.apiKey)
      // props.fetchProfile()
      //  props.close()

      toastSuccess(lang.tr('API Key reset successfully'))
    } catch (err) {
      toastFailure(lang.tr('admin.errorUpdatingProfile', { msg: err.message }))
    }
  }

  return (
    <Dialog.Wrapper title="Developer - API Key" icon="key" isOpen={props.isOpen} onClose={props.close}>
      <Dialog.Body>
        <div>
          <Tabs onChange={tab => setTab(tab)} selectedTabId={tab}>
            <Tab
              id="apiKey"
              title="Your API Key"
              panel={
                <div>
                  API Key: <code>{apiKey || 'No API key yet'}</code>
                  <br /> <br />
                  With an API Key, you will be able to obtain a valid authentication token, which you can then use to
                  call the Botpress API.
                  <br /> <br />
                  Please note that generating a new API Key will render the previous one unusable
                  <br /> <br />
                  <Button id="btn-submit" text="Generate a new API Key" onClick={resetKey} intent={Intent.PRIMARY} />
                </div>
              }
            ></Tab>
            <Tab
              id="obtain"
              title="Using the API Key"
              panel={
                <div>
                  <div>
                    You can use CURL, Axios or any other library to send a POST request to the below endpoint
                    <br></br> <br></br>
                    <div>
                      <code style={{ whiteSpace: 'pre' }}>
                        POST {window.location.origin}/api/v1/auth/generateToken<br></br> {payload}
                      </code>
                    </div>
                  </div>
                </div>
              }
            ></Tab>
            <Tab
              id="usage"
              title="Using the generated token"
              panel={
                <div>
                  <div>
                    Once you have the JWT Token, there are two headers that you need to add on your query. Here is an
                    example with the Converse API:
                    <br></br>
                    <br></br>
                    <div>
                      <code style={{ whiteSpace: 'pre' }}>
                        POST {window.location.origin}/api/v1/bots/BOT_ID/converse/benchmarkUser
                        <br />
                        Authorization: YOUR_TOKEN
                        <br />
                        X-BP-Workspace: default
                        <br />
                        Content-Type: application/json
                        <br />
                        <br />
                        {`{
  "type": "text",
  "text": "hey"
}`}
                      </code>
                    </div>
                  </div>
                </div>
              }
            ></Tab>
          </Tabs>
        </div>
      </Dialog.Body>
    </Dialog.Wrapper>
  )
}

export default Developer
