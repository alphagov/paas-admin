import { VALID_EMAIL_REGEX, VALID_SLUG_REGEX } from './const';
import { IValidationError } from './types';

export function validateRequired(
  value?: string, field = 'value',
  message = 'This field is required'): ReadonlyArray<IValidationError> {
    const errors = [];

    if (!value || value.length === 0) {
      errors.push({ field, message });
    }

    return errors;
  }

export function validateEmail(
  email?: string, field = 'email',
  message = 'Enter an email address in the correct format, like name@example.com'): ReadonlyArray<IValidationError> {
    if (!email) {
      return [];
    }
    const errors = [];

    if (email.length === 0 || !VALID_EMAIL_REGEX.test(email)) {
      errors.push({ field, message });
    }

    return errors;
  }

export function validateSlug(
  slug?: string, field = 'slug',
  message = 'Enter a valid slug (lowercase letters, numbers and hyphens)'): ReadonlyArray<IValidationError> {
    if (!slug) {
      return [];
    }
    const errors = [];

    if (slug.length === 0 || !VALID_SLUG_REGEX.test(slug)) {
      errors.push({ field, message });
    }

    return errors;
  }


export function validateMaxLength(
  value?: string, maxLength = 255, field = 'value',
  message = `This field must be less than ${maxLength} characters`): ReadonlyArray<IValidationError> {
    if (!value) {
      return [];
    }
    const errors = [];

    if (value.length > maxLength) {
      errors.push({ field, message });
    }

    return errors;
  }

export function validateArrayMember(
  value?: string, array: ReadonlyArray<string> = [], field = 'value',
  message = 'This field is not valid'): ReadonlyArray<IValidationError> {
    if (!value) {
      return [];
    }
    const errors = [];

    if (array.indexOf(value) === -1) {
      errors.push({ field, message });
    }

    return errors;
  }
