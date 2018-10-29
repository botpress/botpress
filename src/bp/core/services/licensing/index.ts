import LicensingService, { FingerprintType, LicenseStatus } from 'common/licensing-service'
import { injectable } from 'inversify'

@injectable()
export default class CELicensingService implements LicensingService {
  installProtection(): void {}

  refreshLicenseKey(): Promise<boolean> {
    throw new Error('Not implemented')
  }

  replaceLicenseKey(): Promise<boolean> {
    throw new Error('Not implemented')
  }

  getLicenseStatus(): Promise<LicenseStatus> {
    throw new Error('Not implemented')
  }

  getLicenseKey(): Promise<string> {
    throw new Error('Not implemented')
  }

  getFingerprint(fingerprintType: FingerprintType): Promise<string> {
    throw new Error('Not implemented')
  }
}
