import { describe, expect, it } from 'vitest';

import {
    validateArrayMember,
    validateEmail,
    validateMaxLength,
    validateRequired,
    validateSlug,
} from './validators';

describe('validateRequired', () => {
    it('returns empty array if value is defined', () => {
        const value = 'test';
        const errors = validateRequired(value);
        expect(errors).toEqual([]);
    });

    it('returns array with error if value is undefined', () => {
        const value = undefined;
        const errors = validateRequired(value);
        expect(errors).toEqual([
            { field: 'value', message: 'This field is required' },
        ]);
    });

    it('returns array with error if value is empty string', () => {
        const value = '';
        const errors = validateRequired(value);
        expect(errors).toEqual([
            { field: 'value', message: 'This field is required' },
        ]);
    });

    it('returns array with custom error message if provided', () => {
        const value = undefined;
        const field = 'customField';
        const message = 'This is a custom error message';
        const errors = validateRequired(value, field, message);
        expect(errors).toEqual([{ field, message }]);
    });
});

describe('validateEmail', () => {
    it('returns empty array if email is undefined', () => {
        const email = undefined;
        const errors = validateEmail(email);
        expect(errors).toEqual([]);
    });

    it('returns empty array if email is valid', () => {
        const email = 'test@example.com';
        const errors = validateEmail(email);
        expect(errors).toEqual([]);
    });

    it('returns array with error if email is invalid', () => {
        const email = 'invalid-email';
        const errors = validateEmail(email);
        expect(errors).toEqual([
            {
                field: 'email',
                message: 'Enter an email address in the correct format, like name@example.com',
            },
        ]);
    });

    it('returns array with custom error message if provided', () => {
        const email = 'invalid-email';
        const field = 'customField';
        const message = 'This is a custom error message';
        const errors = validateEmail(email, field, message);
        expect(errors).toEqual([{ field, message }]);
    });
});

describe('validateSlug', () => {
    it('returns empty array if slug is undefined', () => {
        const slug = undefined;
        const errors = validateSlug(slug);
        expect(errors).toEqual([]);
    });

    it('returns empty array if slug is valid', () => {
        const slug = 'valid-slug-123';
        const errors = validateSlug(slug);
        expect(errors).toEqual([]);
    });

    it('returns array with error if slug is invalid', () => {
        const slug = 'invalid slug';
        const errors = validateSlug(slug);
        expect(errors).toEqual([
            {
                field: 'slug',
                message: 'Enter a valid slug (lowercase letters, numbers and hyphens)',
            },
        ]);
    });

    it('returns array with custom error message if provided', () => {
        const slug = 'invalid slug';
        const field = 'customField';
        const message = 'This is a custom error message';
        const errors = validateSlug(slug, field, message);
        expect(errors).toEqual([{ field, message }]);
    });
});

describe('validateMaxLength', () => {
    it('returns empty array if value is undefined', () => {
        const value = undefined;
        const errors = validateMaxLength(value);
        expect(errors).toEqual([]);
    });

    it('returns empty array if value is less than max length', () => {
        const value = 'test';
        const maxLength = 10;
        const errors = validateMaxLength(value, maxLength);
        expect(errors).toEqual([]);
    });

    it('returns array with error if value is greater than max length', () => {
        const value = 'this is a very long string';
        const maxLength = 10;
        const errors = validateMaxLength(value, maxLength);
        expect(errors).toEqual([
            { field: 'value', message: 'This field must be less than 10 characters' },
        ]);
    });

    it('returns array with custom error message if provided', () => {
        const value = 'this is a very long string';
        const maxLength = 10;
        const field = 'customField';
        const message = 'This is a custom error message';
        const errors = validateMaxLength(value, maxLength, field, message);
        expect(errors).toEqual([{ field, message }]);
    });
});

describe('validateArrayMember', () => {
    it('returns empty array if value is undefined', () => {
        const value = undefined;
        const errors = validateArrayMember(value);
        expect(errors).toEqual([]);
    });

    it('returns empty array if value is in array', () => {
        const value = 'test';
        const array = ['test', 'example'];
        const errors = validateArrayMember(value, array);
        expect(errors).toEqual([]);
    });

    it('returns array with error if value is not in array', () => {
        const value = 'invalid';
        const array = ['test', 'example'];
        const errors = validateArrayMember(value, array);
        expect(errors).toEqual([
            { field: 'value', message: 'This field is not valid' },
        ]);
    });

    it('returns array with custom error message if provided', () => {
        const value = 'invalid';
        const array = ['test', 'example'];
        const field = 'customField';
        const message = 'This is a custom error message';
        const errors = validateArrayMember(value, array, field, message);
        expect(errors).toEqual([{ field, message }]);
    });
});
