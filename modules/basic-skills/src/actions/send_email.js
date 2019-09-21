const _ = require('lodash')
const nodemailer = require('nodemailer')
const Promise = require('bluebird')

/**
 * @hidden true
 */

const getTransport = async botId => {
  const config = await bp.config.getModuleConfigForBot('basic-skills', botId)

  if (!config || !config.transportConnectionString || config.transportConnectionString === '<<change me>>') {
    throw new Error(
      `You must configure the "skill-email" module with valid SMTP credentials to send emails. Please see 'global/config/basic-skills.json'.`
    )
  }

  return config.transportConnectionString
}

const extractTextFromPreview = text => text.replace('(missing translation) ', '').replace(/([A-Z0-9_ -]+: )/gi, '')

const sendEmail = async () => {
  try {
    const transport = await getTransport(event.botId)
    const transporter = nodemailer.createTransport(transport)

    const language = _.get(event, 'state.user.language', undefined)
    const defaultLanguage = (await bp.bots.getBotById(event.botId)).defaultLanguage

    const subjectEl = await bp.cms.getContentElement(event.botId, args.subjectElement, language)
    const contentEl = await bp.cms.getContentElement(event.botId, args.contentElement, language)
    const subject = subjectEl.previews[language] || subjectEl.previews[defaultLanguage]
    const content = contentEl.previews[language] || contentEl.previews[defaultLanguage]

    const mailOptions = {
      from: args.fromAddress,
      to: args.toAddress,
      cc: args.ccAddress,
      bcc: args.bccAddress,
      subject: extractTextFromPreview(subject),
      text: extractTextFromPreview(content),
      html: extractTextFromPreview(content)
    }

    await Promise.fromCallback(cb => transporter.sendMail(mailOptions, cb))
    event.state.temp.success = true
  } catch (error) {
    event.state.temp.success = false
    event.state.temp.onErrorFlowTo = '#'

    throw error
  }
}

return sendEmail()
