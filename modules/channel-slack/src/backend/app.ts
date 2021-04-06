import {Config} from "../config";
import {App, ExpressReceiver} from "@slack/bolt";
import InstallationRepository from "./repository";
import {Installation} from '@slack/oauth'
// @ts-ignore
import _ from 'lodash'


export abstract class SlackApp {

    protected bolt: App
    protected receiver: ExpressReceiver;
    protected readonly botId: string;

    protected constructor(botId: string) {
        this.botId = botId
    }

    public getApp(): App {
        return this.bolt
    }

    public getReceiver(): ExpressReceiver {
        return this.receiver
    }

    public getEventsUrl(config: Config) {
        return `/${this.botId}${config.eventsUrl}`
    }

    protected logUrl(logger, publicPath, description, url): void {
        logger.info(`[${this.botId}] ${description}: ${publicPath.replace('BOT_ID', this.botId)}${url}`)
    }

    public logUrls(logger, publicPath: string, config: Config) {
        this.logUrl(logger, publicPath, 'Slack events URL', this.getEventsUrl(config))
    }
}


class SingleWorkspaceApp extends SlackApp {

    constructor(botId: string, config: Config) {
        super(botId);
        this.receiver = new ExpressReceiver({
            signingSecret: config.signingSecret,
            endpoints: this.getEventsUrl(config)
        })

        this.bolt = new App({
            token: config.botToken,
            botId: config.botId,
            receiver: this.receiver
        })
    }
}

class MultiWorkspaceApp extends SlackApp {
    private installationRepository: InstallationRepository;
    private logger: any;

    constructor(
        botId: string,
        installationRepository: InstallationRepository,
        config: Config,
        logger: any
    ) {
        super(botId);
        this.installationRepository = installationRepository
        this.logger = logger;

        this.receiver = new ExpressReceiver({
            signingSecret: config.signingSecret,
            clientId: config.clientId,
            clientSecret: config.clientSecret,
            stateSecret: config.stateSecret,
            scopes: config.scopes,
            endpoints: this.getEventsUrl(config),
            installationStore: {
                storeInstallation: this.storeInstallation,
                fetchInstallation: this.fetchInstallation
            },
            installerOptions: {
                installPath: this.getInstallUrl(config),
                redirectUriPath: this.getRedirectUrl(config),
                callbackOptions: {
                    success: config.successRedirectUrl ?
                        (installation, installOptions, req, res) => {
                            res.writeHead(302, {
                                'Location': this.substituteParams(config.successRedirectUrl, installation)
                            });
                            res.end();
                        } : undefined,
                    failure: config.failureRedirectUrl ?
                        (installation, installOptions, req, res) => {
                            res.writeHead(302, {
                                'Location': this.substituteParams(config.failureRedirectUrl, installation)
                            });
                            res.end();
                        } : undefined
                }
            }
        })

        this.setUpInstallUrlEndpoint(config, this.receiver)

        this.bolt = new App({
            botId: config.botId,
            receiver: this.receiver
        })
    }

    private substituteParams(url: string, installation): string {
        if (!url || !installation) {
            return url;
        }
        const i = JSON.parse(JSON.stringify(installation)); //deep clone
        delete i.bot;
        return url
            .replace('{team.id}', _.get(i, 'team.id', ''))
            .replace('{appId}', _.get(i, 'appId', ''))
            .replace('{installation}', Buffer.from(JSON.stringify(i)).toString('base64'))
    }

    private setUpInstallUrlEndpoint(config: Config, expressReceiver: ExpressReceiver) {
        if (config.installUrlEndpoint) {
            expressReceiver.app.get(this.getInstallUrlEndpoint(config), async (req, res) => {
                res.json({
                    installUrl: await expressReceiver.installer.generateInstallUrl({
                        scopes: config.scopes
                    })
                })
            })
        }
    }

    private storeInstallation = async (installation) => {
        await this.installationRepository.saveInstallation({
            team: installation.team.id,
            installation: JSON.stringify(installation)
        })
        this.logger.info(`Bot installed for the team ${installation.team.id}`)
    }

    private fetchInstallation = async (InstallQuery): Promise<Installation> => {
        const installation = await this.installationRepository
            .getInstallation({team: InstallQuery.teamId})
        if(typeof installation.installation === 'string')
            return JSON.parse(installation.installation)
        return installation.installation
    }

    public getInstallUrl(config: Config) {
        return `/${this.botId}${config.installUrl}`
    }

    public getRedirectUrl(config: Config) {
        return `/${this.botId}${config.redirectUrl}`
    }

    public getInstallUrlEndpoint(config: Config) {
        return `/${this.botId}${config.installUrlEndpoint}`
    }

    public logUrls(logger, publicPath: string, config: Config): void {
        super.logUrls(logger, publicPath, config)
        this.logUrl(logger, publicPath, 'Slack redirect URL', this.getRedirectUrl(config))
        this.logUrl(logger, publicPath, 'Slack install URL', this.getInstallUrl(config))
        config.installUrlEndpoint && this.logUrl(
            logger, publicPath, 'Slack install URL endpoint', this.getInstallUrlEndpoint(config))
    }
}


export default (
    botId: string,
    publicPath: string,
    logger,
    repository: InstallationRepository,
    config: Config
): SlackApp => {
    const app = config.type === "single" ?
        new SingleWorkspaceApp(botId, config) :
        new MultiWorkspaceApp(botId, repository, config, logger);

    app.logUrls(logger, publicPath, config)

    return app;
}
