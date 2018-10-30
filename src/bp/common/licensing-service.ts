export default interface LicensingService {
  installProtection(): void
  refreshLicenseKey(): Promise<boolean>
  replaceLicenseKey(licenseKey: string): Promise<boolean>

  getLicenseStatus(): Promise<LicenseStatus>
  getLicenseInfo(licenseKey?: string): Promise<LicenseInfo>
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
  paidUntil: Date
  versions: string
  seats: number
  support: 'standard'
}
