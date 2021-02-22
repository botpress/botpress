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
    const data = await apiAuthService.confirmOTP({
      ...temp.authData,
      Content: {
        Reference: temp.choice.Reference,
        TrustedConnection: 'N',
        Type: temp.choice.Type,
        Value: otp,
      },
      Type: temp.authData.Code,
    });

    console.log(data)

    temp.authData = data
  } catch (e) {
    console.log(e)
    const sessionId = bp.dialog.createId(event)
    await bp.dialog.jumpTo(sessionId, event, 'error.flow.json', e.httpCode)
  }
}

return sendOTP(args.otp)
