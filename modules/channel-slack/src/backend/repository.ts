// @ts-ignore
import * as sdk from 'botpress/sdk'

export default class InstallationRepository {
    private readonly knex: any
    private readonly table: string;

    constructor(private bp: typeof sdk) {
        this.knex = bp.database
        this.table = 'slack_tokens'
    }

    initialize() {
        if (!this.knex)
            throw new Error('You must initialize the database before')

        this.knex.createTableIfNotExists(this.table, function (table) {
            table.string('team').primary()
            table.json('installation')
            table.timestamps(true, true)
        })
    }

    async saveInstallation({team, installation}) {
        const data = {
            team: team,
            installation: installation
        }

        try {
            await this.getInstallation({team})
        } catch (e) {
            if (e instanceof InstallationNotFoundError) {
                return this.knex(this.table).insert(data);
            } else {
                throw e; // let others errors bubble up
            }
        }

        return this.knex(this.table)
            .where({team})
            .update({
                ...data,
                updated_at: this.knex.fn.now()
            });
    }

    getInstallation({team}) {
        return this.knex(this.table)
            .where({team})
            .select('installation')
            .first()
            .then(installation => {
                if (!installation)
                    throw new InstallationNotFoundError(`El bot no fue instalado en el equipo ${team}.`)
                return installation
            })
    }
}


class InstallationNotFoundError extends Error {
}
