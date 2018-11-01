import { VError } from 'verror'
export class FatalError extends VError {}
export class ValidationError extends VError {}
export class ConfigurationError extends VError {}
export class InvalidParameterError extends VError {}
export class UnlicensedError extends VError {}
