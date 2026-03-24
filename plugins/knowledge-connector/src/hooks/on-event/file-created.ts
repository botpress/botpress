import { handleFileUpsert } from './file-upserted'
import * as bp from '.botpress'

export const handleEvent: bp.EventHandlers['files-readonly:fileCreated'] = async (props) => {
  await handleFileUpsert(props)
}
