import { SLUG_REGEX } from '../../layouts'
import { IValidationError } from '../errors/types'

import { INewOrganizationUserBody } from './views'

export function validateNewOrganization (body: INewOrganizationUserBody): readonly IValidationError[] {
  const errors: IValidationError[] = []

  if (!body.organization) {
    errors.push({ field: 'organization', message: 'Organisation name is a required field' })
  }

  if (body.organization && (body.organization.match(SLUG_REGEX) == null)) {
    errors.push({ field: 'organization', message: 'Organisation name must be all lowercase and hyphen separated' })
  }

  if (!body.owner) {
    errors.push({ field: 'owner', message: 'Owner is a required field' })
  }

  return errors
}
