import { Button, Intent, Tab, Tabs } from '@blueprintjs/core'
import { AxiosResponse } from 'axios'
import { lang, Dialog } from 'botpress/shared'
import { UserProfile } from 'common/typings'
import React, { FC, useEffect, useState } from 'react'
import api from '~/api'
import { toastFailure, toastSuccess } from '~/utils/toaster'

interface Props {
  isOpen: boolean
  profile: UserProfile
  close: () => void
}

interface ApiKey {
  apiKey: string
}

const DEFAULT_PAYLOAD = { email: '', strategy: '', apiKey: '' }

const Developer: FC<Props> = props => {
  const [apiKey, setApiKey] = useState<string>()
  const [payload, setPayload] = useState(JSON.stringify(DEFAULT_PAYLOAD, undefined, 2))
  const [tab, setTab] = useState<string | number>('apiKey')

  useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    getKey()
  }, [props.isOpen])

  useEffect(() => {
    if (props.profile && apiKey) {
      const { email, strategy } = props.profile
      const example = { email, strategy, apiKey }
      setPayload(JSON.stringify(example, undefined, 2))
    } else {
      setPayload(JSON.stringify(DEFAULT_PAYLOAD, undefined, 2))
    }
  }, [apiKey])

  const getKey = async () => {
    try {
      const { data } = await api.getSecured().get<any, AxiosResponse<ApiKey>>('/auth/apiKey')
      setApiKey(data.apiKey)
    } catch (err) {
      toastFailure(lang.tr('admin.errorUpdatingProfile', { msg: err.message }))
    }
  }

  const generateKey = async (event: React.MouseEvent<HTMLElement, MouseEvent>) => {
    event.preventDefault()

    try {
      const { data } = await api.getSecured().post<any, AxiosResponse<ApiKey>>('auth/apiKey')
      setApiKey(data.apiKey)

      toastSuccess(lang.tr('API Key generated successfully'))
    } catch (err) {
      toastFailure(lang.tr('admin.errorUpdatingProfile', { msg: err.message }))
    }
  }

  const revokeKey = async (event: React.MouseEvent<HTMLElement, MouseEvent>) => {
    event.preventDefault()

    try {
      await api.getSecured().post('auth/apiKey/revoke')
      setApiKey(undefined)

      toastSuccess(lang.tr('API Key successfully revoked'))
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
                  <br />
                  {apiKey && <Button id="btn-revoke" text="Revoke" onClick={revokeKey} intent={Intent.DANGER} />}
                  <br /> <br />
                  With an API Key, you will be able to cal the Converse API.
                  <br /> <br />
                  Please note that generating a new API Key will render the previous one unusable.
                  <br /> <br />
                  <Button id="btn-submit" text="Generate a new API Key" onClick={generateKey} intent={Intent.PRIMARY} />
                </div>
              }
            ></Tab>
            <Tab
              id="usage"
              title="Using the API Key"
              panel={
                <div>
                  <div>
                    Here is an example with the Converse API:
                    <br></br>
                    <br></br>
                    <div>
                      <code style={{ whiteSpace: 'pre' }}>
                        POST {window.location.origin}/api/v1/bots/[BOT_ID]/converse/benchmark[USER_ID]?apiKey=XXXXX
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
