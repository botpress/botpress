import React from 'react'
import { getHost } from './util'

const AboutGhostContent = () => (
  <section>
    <p>Some of the bot's behavior is determined by the content coming from the files (Content / Forms, Flows).</p>
    <p>For your convenience Botpress provides the GUI tools to edit these files while in development.</p>
    <p>
      We also provide the same tools in production, but there's a caveat. If we would write the same change to the
      server's file system they could easily be lost due to the nature of ephemeral server instances (when the new
      version of the bot is deployed the old server instance may be simply shut down by the cloud hosting platform).
    </p>
    <p>
      To address this issue we give you the Ghost COntent feature. In production your changes are saved to the database
      which is persisted between deployments. But how do you get these changes back to your bot's codebase?
    </p>
    <p>
      To do so you run a special command from your bot folder,&nbsp;
      <code>./node_modules/.bin/botpress ghost-sync {getHost()}</code>. This will fetch the updated content from the
      server, apply it to the local file system, and also record the revision IDs in a special file.
    </p>
    <p>The synchronisation is finalized after these updated files are redeployed.</p>
  </section>
)

export default AboutGhostContent
