import {Configuration} from "pipedrive/v2";

export const bpWebHookUrl: string = 'https://webhook.botpress.cloud/<id>'


// TODO: should be moved to bp secrets manager; not sure yet how to do it
export const pipeDriveConfig = new Configuration({
    apiKey: ''
})

export const pipeDriveBaseUrl = 'https://api.pipedrive.com/v1'

// Leads constants
export const createLead = "createLead"
export const changeLead = "changeDeal"
export const deleteLead = "deleteDeal"

// Deal constants
export const createDeal = "createDeal"
export const changeDeal = "changeDeal"
export const deleteDeal = "deleteDeal"