import { Button, Callout } from '@blueprintjs/core'
import { ModuleUI, toast } from 'botpress/shared'
import _ from 'lodash'
import React from 'react'

const { Container } = ModuleUI

const FullView = props => {
  const migrateBot = async () => {
    try {
      await props.bp.axios.post('/mod/ndu/migrate')
      toast.success('Bot migrated successfully ! Reloading...')

      window.location.reload()
    } catch (err) {
      toast.failure(err.message)
    }
  }

  return (
    <Container sidePanelHidden={true}>
      <div />
      <div style={{ padding: 10 }}>
        <Callout title="Migrate">
          Migration will do the following actions:
          <ol>
            <li>Import required flows in this bot</li>
            <li>Create required content elements</li>
            <li>Update your existing flows</li>
            <li>Update the bot configuration file</li>
            <li>Create a topic for each existing NLU context</li>
          </ol>
          <Button onClick={migrateBot}>Migrate</Button>
        </Callout>
      </div>
    </Container>
  )
}

export default FullView
