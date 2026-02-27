import crypto from 'crypto'

// ============== SHA1 Signature Verification ==============
// wechat really requires the signature to be in the order of token, timestamp, nonce
function computeWeChatSignature(...args: string[]): string {
  const sortedList = [...args].sort()

  const sha1 = crypto.createHash('sha1')
  sortedList.forEach((item) => sha1.update(item, 'utf8'))

  return sha1.digest('hex')
}

// ============== XML Parsing ================================================
// Example of the XML we receive from WeChat:
// <xml>
//  <ToUserName><![CDATA[服务号]]></ToUserName>
//  <FromUserName><![CDATA[粉丝号]]></FromUserName>
//  <CreateTime>1460537339</CreateTime>
//  <MsgType><![CDATA[text]]></MsgType>
//  <Content><![CDATA[value]]></Content>
//  <MsgId>6272960105994287618</MsgId>
// </xml>

type WeChatMessage = {
  ToUserName: string
  FromUserName: string
  CreateTime: string
  MsgType: string
  MsgId?: string
  Content?: string // for text messages
  PicUrl?: string // for image messages
  MediaId?: string // for image/voice/video messages
  Recognition?: string // for voice messages (speech recognition)
  Location_X?: string // for location messages
  Location_Y?: string
  Label?: string
  Title?: string // for link messages
  Description?: string
  Url?: string
}

function parseWeChatMessageXml(webData: string): WeChatMessage | null {
  if (!webData || webData.length === 0) {
    return null
  }
  // parse the message from the xml
  const extractValue = (xml: string, tag: string): string | undefined => {
    // find pattern of CDATA or plain text: <Tag><![CDATA[value]]></Tag> or <Tag>value</Tag>
    const valueRegex = new RegExp(`<${tag}>\\s*(?:<!\\[CDATA\\[)?([\\s\\S]*?)(?:\\]\\]>)?\\s*</${tag}>`, 'i')
    const match = xml.match(valueRegex)
    return match?.[1]
  }

  const toUserName = extractValue(webData, 'ToUserName')
  const fromUserName = extractValue(webData, 'FromUserName')
  const msgType = extractValue(webData, 'MsgType')

  // Drop malformed XML early to avoid empty IDs downstream.
  if (!toUserName || !fromUserName || !msgType) {
    return null
  }

  const msg: WeChatMessage = {
    ToUserName: toUserName,
    FromUserName: fromUserName,
    CreateTime: extractValue(webData, 'CreateTime') || '',
    MsgType: msgType,
    MsgId: extractValue(webData, 'MsgId'),
    Content: extractValue(webData, 'Content'),
    PicUrl: extractValue(webData, 'PicUrl'),
    MediaId: extractValue(webData, 'MediaId'),
    Recognition: extractValue(webData, 'Recognition'),
    Location_X: extractValue(webData, 'Location_X'),
    Location_Y: extractValue(webData, 'Location_Y'),
    Label: extractValue(webData, 'Label'),
    Title: extractValue(webData, 'Title'),
    Description: extractValue(webData, 'Description'),
    Url: extractValue(webData, 'Url'),
  }

  return msg
}

// ============== Main Handler ==============
export type WeChatVerification = {
  wechatToken: string
  method: string
  signature?: string
  timestamp?: string
  nonce?: string
  echostr?: string
  body?: string
}

export type ResponseToWeChat = {
  isValid: boolean
  echostr?: string
  message?: WeChatMessage
}

export function handleWechatSignatureVerification(params: WeChatVerification): ResponseToWeChat {
  const { wechatToken, method, signature, timestamp, nonce, echostr, body } = params
  const normalizedMethod = method
  // WeChat signature is SHA1(sorted(token, timestamp, nonce)).
  const hashcode = computeWeChatSignature(wechatToken, timestamp || '', nonce || '')

  // signature === SHA1(token, timestamp, nonce)

  // ========== Handle GET (Webhook Verification) ==========
  if (normalizedMethod === 'GET') {
    const isValid = hashcode === signature
    return { isValid, echostr }
  }

  // ========== Handle POST (Message Receive) ==========
  if (normalizedMethod === 'POST') {
    if (!signature || !timestamp || !nonce) {
      return { isValid: false }
    }

    if (hashcode !== signature) {
      return { isValid: false }
    }

    // Parse the incoming XML
    const recMsg = parseWeChatMessageXml(body || '')

    if (!recMsg) {
      return { isValid: true }
    }

    // Return the parsed message to be handled by Botpress
    // We return 'success' to tell WeChat we received the message
    return { isValid: true, message: recMsg }
  }

  // Other methods not allowed
  return { isValid: false }
}
