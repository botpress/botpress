const { apiAuthService } = require('@rdcdev/dbank-client')

/**
 * Send OTP
 *
 * @title Send otp
 * @category Auth
 * @param {string} otp The otp
 */
const sendOTP = async (otp) => {
  try {
    const authData = await apiAuthService.confirmOTP({
      ...temp.authData.authData,
      Content: {
        Reference: temp.choice.Reference,
        TrustedConnection: 'N',
        Type: temp.choice.Type,
        Value: otp,
      },
      Type: temp.authData.Code,
    });

    temp.authData = {
      SessionKey: authData.SessionKey,
      secretKey: authData.secretKey,
      ChannelID: authData.ChannelID,
      token: authData.token,
      SessionID: authData.SessionID,
      SessionSalt: authData.SessionSalt,
    }
  } catch (e) {
    const sessionId = bp.dialog.createId(event)
    await bp.dialog.jumpTo(sessionId, event, 'error.flow.json', e.httpCode)
  }
}

return sendOTP(args.otp)
