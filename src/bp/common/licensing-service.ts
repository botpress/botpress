export default interface LicensingService {
  installProtection(): void
  refreshLicenseKey(): Promise<boolean>
  replaceLicenseKey(licenseKey: string): Promise<boolean>

  getLicenseStatus(): Promise<LicenseStatus>
  getLicenseInfo(licenseKey?: string): Promise<LicenseInfo>
  getLicenseKey(): Promise<string>
  getFingerprint(fingerprintType: FingerprintType): Promise<string>

  assertFeatureLicensed(feature: Features): void
  setFeatureValue(feature: Features, value: number): void
}

export interface LicenseStatus {
  status: 'licensed' | 'invalid' | 'breached'
  breachReasons: string[]
}

export type FingerprintType = 'machine_v1' | 'cluster_url'
export type SupportType = 'standard' | 'gold'
export enum Features {
  Admins,
  FullTimeNodes
}

export interface Limit {
  min: number
  max: number
  feature: Features
  description: string
  breachMessage: string
  breachConsequence: 'crash' | 'throw'
}

export interface LicenseInfo {
  fingerprintType: FingerprintType
  fingerprint: string
  edition: 'pro'
  startDate: string
  endDate: string
  paidUntil: Date
  versions: string
  support: SupportType
  limits: Limit[]
}
