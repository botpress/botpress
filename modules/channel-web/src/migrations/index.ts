import * as sdk from 'botpress/sdk'

export default class Migration {
  public async execute(dryRun?: boolean): sdk.MigrationStatus {
    const migrationStatus = {
      hasConfigChanges: false,
      hasFileChanges: false
    }

    // If something needs to be updated...
    migrationStatus.hasConfigChanges = false

    if (!dryRun) {
      // Do it !
    }

    return migrationStatus
  }
}
