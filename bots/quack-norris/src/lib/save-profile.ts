import { PlayersTable } from '../tables/Players'
import type { ProfileRow } from './command-context'

/** Version conflict error — thrown when a concurrent write has occurred since the profile was loaded. */
export class VersionConflictError extends Error {
  public constructor(
    public readonly discordUserId: string,
    public readonly expectedVersion: number,
    public readonly actualVersion: number
  ) {
    super(`Version conflict for ${discordUserId}: expected ${expectedVersion}, found ${actualVersion}`)
    this.name = 'VersionConflictError'
  }
}

/**
 * Save profile to DB with optimistic concurrency control.
 * Checks that the DB version matches what we loaded before writing.
 * Throws VersionConflictError if another write occurred since we loaded.
 */
export const saveProfile = async (profile: ProfileRow): Promise<void> => {
  const currentVersion = (profile.version as number) ?? 0

  // Optimistic concurrency check: re-read to verify no concurrent write
  const { rows } = await PlayersTable.findRows({ filter: { discordUserId: profile.discordUserId }, limit: 1 })
  const dbProfile = rows[0]
  if (dbProfile) {
    const dbVersion = (dbProfile.version as number) ?? 0
    if (dbVersion > currentVersion) {
      throw new VersionConflictError(profile.discordUserId, currentVersion, dbVersion)
    }
  }

  const updated = { ...profile, version: currentVersion + 1 }
  await PlayersTable.upsertRows({ rows: [updated], keyColumn: 'discordUserId' })
}
