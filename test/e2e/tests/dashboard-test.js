import { InformationPanel, MiddlewaresPanel } from '../page-model/dashboard'
import botData from '../bot-data.json'

fixture `Dashboard page`
    .page('http://localhost:3000')

test('check information panel', async t => {
    let infoPanel = new InformationPanel()

    await t
        .expect(infoPanel.name.textContent).eql(botData.name)
        .expect(infoPanel.description.textContent).eql(botData.description)
        .expect(infoPanel.author.textContent).contains(botData.author)
        .expect(infoPanel.version.textContent).contains(botData.version)
        .expect(infoPanel.license.textContent).contains('AGPL-3.0')
})

test('check middlewares', async t => {
    let middlewaresPanel = new MiddlewaresPanel()

    await t
        .expect(middlewaresPanel.middlewares.count).eql(1)

    let middleware = middlewaresPanel.getMiddleware(0)

    await t
        .expect(middleware.name.textContent).eql('botpress')
        .expect(middleware.enabled).ok()

        .click(middleware.name)
        .click(middlewaresPanel.saveBtn)

        .expect(middleware.enabled).notOk()

        .click(middleware.name)
        .click(middlewaresPanel.saveBtn)

        .expect(middleware.enabled).ok()
})

