import * as sdk from '@botpress/sdk'
import { JWT } from 'google-auth-library'
import { google, drive_v3 } from 'googleapis'

export const getClient = async ( ctx: sdk.IntegrationContext): Promise<drive_v3.Drive>  => {
    const auth = new JWT({
        email: ctx.configuration.clientEmail,
        key: ctx.configuration.privateKey.replace(/\\n/g, '\n'),
        scopes: ['https://www.googleapis.com/auth/drive'] // TODO: Limit scopes
    })

    // TODO: Handle errors
    // TODO: Handle token expiration?

    return google.drive({ version: 'v3', auth })
}
