export default interface LicensingService {
  installProtection(): void
  refreshLicenseKey(): Promise<boolean>
  replaceLicenseKey(licenseKey: string): Promise<boolean>

  getLicenseStatus(): Promise<LicenseStatus>
  getLicenseInfo(licenseKey?: string): Promise<LicenseInfo>
  getLicenseKey(): Promise<string>
  getFingerprint(fingerprintType: FingerprintType): Promise<string>
  auditLicensing(auditToken: string): Promise<LicenseAudit | undefined>
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
  label: string
  fingerprintType: FingerprintType
  fingerprint: string
  startDate: string
  endDate: string
  offline: boolean
  paidUntil: Date
  versions: string
  support: SupportType
  auditToken: string
  limits: Limit[]
  manualRefresh: boolean
}

export interface LicenseAudit {
  botIds?: string[]
  showPoweredBy?: boolean
  superAdminsCount: number
  collaboratorsCount: number
}
