import { Button, Intent, Tab, Tabs } from '@blueprintjs/core'
import { AxiosResponse } from 'axios'
import { lang, Dialog, toast, confirmDialog } from 'botpress/shared'
import { UserProfile } from 'common/typings'
import React, { FC, useEffect, useState } from 'react'
import api from '~/app/api'

interface Props {
  isOpen: boolean
  profile: UserProfile
  close: () => void
}

interface ApiKey {
  apiKey: string
}

const BASE_URL_PATH = '/admin/auth/apiKey'

const Developer: FC<Props> = props => {
  const [apiKey, setApiKey] = useState<string>()
  const [tab, setTab] = useState<string | number>('apiKey')

  useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    getKey()
  }, [props.isOpen])

  const getKey = async () => {
    try {
      const { data } = await api.getSecured().get<any, AxiosResponse<ApiKey>>(BASE_URL_PATH)
      setApiKey(data.apiKey)
    } catch (err) {
      toast.failure(lang.tr('admin.developer.errorFetchingApiKey', { msg: err.message }))
    }
  }

  const generateKey = async (event: React.MouseEvent<HTMLElement, MouseEvent>) => {
    event.preventDefault()

    if (!(await confirmDialog(lang.tr('admin.developer.apiKeyGenerationWarning'), {}))) {
      return
    }

    try {
      const { data } = await api.getSecured().post<any, AxiosResponse<ApiKey>>(BASE_URL_PATH)
      setApiKey(data.apiKey)

      toast.success(lang.tr('admin.developer.apiKeySuccessfullyGenerated'))
    } catch (err) {
      toast.failure(lang.tr('admin.developer.errorGeneratingApiKey', { msg: err.message }))
    }
  }

  const revokeKey = async (event: React.MouseEvent<HTMLElement, MouseEvent>) => {
    event.preventDefault()

    try {
      await api.getSecured().post(`${BASE_URL_PATH}/revoke`)
      setApiKey(undefined)

      toast.success(lang.tr('admin.developer.apiKeySuccessfullyRevoked'))
    } catch (err) {
      toast.failure(lang.tr('admin.developer.errorRevokingApiKey', { msg: err.message }))
    }
  }

  return (
    <Dialog.Wrapper
      title={`${lang.tr('admin.developerMenu')} - ${lang.tr('admin.developer.apiKey')}`}
      icon="key"
      isOpen={props.isOpen}
      onClose={props.close}
    >
      <Dialog.Body>
        <div>
          <Tabs onChange={tab => setTab(tab)} selectedTabId={tab}>
            <Tab
              id="apiKey"
              title={lang.tr('admin.developer.apiKeyGenerationTitle')}
              panel={
                <div>
                  {lang.tr('admin.developer.apiKey')}
                  <code>
                    {(apiKey && (
                      <div>
                        <br />
                        {apiKey}
                        <br /> <br />
                      </div>
                    )) ||
                      lang.tr('admin.developer.noApiKey')}
                  </code>
                  {apiKey && (
                    <Button
                      id="btn-revoke"
                      text={lang.tr('admin.developer.revoke')}
                      onClick={revokeKey}
                      intent={Intent.DANGER}
                    />
                  )}
                  <br /> <br />
                  <b>{lang.tr('admin.developer.apiKeyGenerationBetaWarning')}</b>
                  <br /> <br />
                  {lang.tr('admin.developer.apiKeyGenerationOverrideWarning')}
                  <br /> <br />
                  <Button
                    id="btn-submit"
                    text={lang.tr('admin.developer.generateApiKey')}
                    onClick={generateKey}
                    intent={Intent.PRIMARY}
                  />
                </div>
              }
            ></Tab>
            <Tab
              id="usage"
              title={lang.tr('admin.developer.apiKeyUsageTitle')}
              panel={
                <div>
                  <div>
                    {lang.tr('admin.developer.apiKeyUsageExample')}
                    <br />
                    <br />
                    <div>
                      <code style={{ whiteSpace: 'pre' }}>
                        POST {window.location.origin}/api/v1/bots/[BOT_ID]/
                        <br />
                        &nbsp;&nbsp;converse/[CONVERSATION_ID]/secured
                        <br />
                        Content-Type: application/json
                        <br />
                        x-bp-api-key: [YOUR_API_KEY]
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
