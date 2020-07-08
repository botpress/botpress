export interface StoreInfoType {
  [key: string]: Function
}

export interface EventPackageInfoType {
  [key: string]: EventPackageInfoBody
}

export interface EventPackageInfoBody {
  locked: boolean
  timeout: string
  getPackage: Function
}
