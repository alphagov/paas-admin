import { SLUG_REGEX } from '../../layouts';
import { IValidationError } from '../errors/types';


import { owners } from './owners';

const orgNameMaxLength = 255;

export const fieldRequiredValidation = (
    value: string | undefined, field: string, message: string): ReadonlyArray<IValidationError> => {
    const errors = [];

    if (!value) {
        errors.push({
            field,
            message,
        });
    }

    return errors;
};

export const orgNameValidation = (value?: string): ReadonlyArray<IValidationError> => {
    const errors = [];
    if (!value) {
        errors.push({
            field: 'name',
            message: 'Organisation name is required',
        });

        return errors;
    }
    if (value.length > orgNameMaxLength) {
        errors.push({
            field: 'name',
            message: `Organisation name must be less than ${orgNameMaxLength} characters`,
        });
    }
    if (!value.match(SLUG_REGEX)) {
        errors.push({
            field: 'name',
            message: 'Organisation name must only contain lowercase letters, numbers and hyphens',
        });
    }

    return errors;
};

export const orgOwnerValidation = (value?: string): ReadonlyArray<IValidationError> => {
    const errors = [];

    if (!value) {
        errors.push({
            field: 'owner',
            message: 'Organisation owner is required',
        });

        return errors;
    }
    if (owners.indexOf(value) === -1) {
        errors.push({
            field: 'owner',
            message: 'Organisation owner is not valid',
        });
    }

    return errors;
};
