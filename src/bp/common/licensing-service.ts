export default interface LicensingService {
  installProtection(): void
  refreshLicenseKey(): Promise<boolean>
  replaceLicenseKey(): Promise<boolean>

  getLicenseStatus(): Promise<LicenseStatus>
  getLicenseKey(): Promise<string>
  getFingerprint(fingerprintType: FingerprintType): Promise<string>
}

export interface LicenseStatus {
  status: 'licensed' | 'invalid' | 'breached'
  breachReasons: string[]
}

export type FingerprintType = 'machine_v1'

export interface LicenseInfo {
  fingerprintType: FingerprintType
  fingerprint: string
  edition: 'pro' | 'enterprise'
  startDate: string
  endDate: string
  versions: string
  seats: number
}
