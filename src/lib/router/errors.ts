export class NotFoundError extends Error {
  constructor (message: string) {
    super(message)
    this.name = 'NotFoundError'
  }
}

export class NotAuthorisedError extends Error {
  constructor (message: string) {
    super(message)
    this.name = 'NotAuthorisedError'
  }
}
