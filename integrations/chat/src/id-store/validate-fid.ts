export type FidValidationResult =
  | {
      success: true
    }
  | {
      success: false
      reason: string
    }

/**
 * The fid store uses a local secondary index in dynamodb. The LSI are limited to 10GB of storage.
 * By setting the max fid length to 70 and knowing that a botpress ID is a ULID of < 30 characters,
 * we can safely assume that each bot can hold up to 10 million fids.
 */
const MAX_FID_LENGTH = 70

/**
 * By limiting the set of allowed characters in a fid, we leave the door open for creating
 * composite keys in the future.
 */
const FID_REGEX = /^[a-zA-Z0-9_\-\\/]+$/

export const validateFid = (fid: string): FidValidationResult => {
  if (fid.length > MAX_FID_LENGTH) {
    return { success: false, reason: `Fid length exceeds the maximum allowed length of ${MAX_FID_LENGTH}` }
  }

  const isValid = FID_REGEX.test(fid)
  if (!isValid) {
    return { success: false, reason: 'Fid contains invalid characters' }
  }

  return { success: true }
}
