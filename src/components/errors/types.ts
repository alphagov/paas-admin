export interface IValidationError {
  readonly field: string
  readonly message: string
}
export interface IDualValidationError extends IValidationError{
  readonly messageExtra?: string
}
