'use strict'
// all the rules from https://github.com/alphagov/stylelint-config-gds
// once they sort theirs out we can switch over
module.exports = {
  extends: 'stylelint-config-standard-scss',
  rules: {
    // This rule is disabled because our house style has a lot of at-rules
    // via SCSS where new lines are used indiscriminately for readability.
    // https://stylelint.io/user-guide/rules/at-rule-empty-line-before
    "at-rule-empty-line-before": null,
    // Always require a newline after a closing brace of a rule
    // https://stylelint.io/user-guide/rules/block-closing-brace-newline-after
    // Originates from: https://github.com/kristerkari/stylelint-scss/blob/f54d9861e35891312bda98afe2404a993a4262e0/docs/examples/if-else.md
    'block-closing-brace-newline-after': [
      'always', {
        // Exceptions for conditionals, particularly useful for SCSS.
        ignoreAtRules: ['if', 'else'],
      },
    ],
    // Disallow using CSS named colours
    // https://stylelint.io/user-guide/rules/color-named
    // Originates from: https://github.com/alphagov/govuk-frontend/blob/e248b4027102b2684f592a0501630075bdfa1fab/config/.sass-lint.yml#L149
    'color-named': 'never',
    // Require 6 character hex definitions when 3 would work
    // https://stylelint.io/user-guide/rules/color-hex-length
    // Originates from: https://github.com/alphagov/govuk-frontend/blob/master/docs/contributing/coding-standards/css.md#colours-defined-as-variables-should-be-in-lowercase-and-in-full-length
    'color-hex-length': 'long',
    // Require all rules to be multiline
    // https://stylelint.io/user-guide/rules/declaration-block-single-line-max-declarations
    // Originates from: https://github.com/alphagov/govuk-frontend/blob/e248b4027102b2684f592a0501630075bdfa1fab/config/.sass-lint.yml#L32
    'declaration-block-single-line-max-declarations': 0,
    // It's common for us to break up groups of CSS with an empty line
    // https://stylelint.io/user-guide/rules/declaration-empty-line-before
    'declaration-empty-line-before': null,
    // Disallow !important within declarations
    // https://stylelint.io/user-guide/rules/declaration-no-important
    'declaration-no-important': true,
    // Properties and values that are disallowed
    // https://stylelint.io/user-guide/rules/declaration-property-value-disallowed-list
    'declaration-property-value-disallowed-list': {
      // Originates from: https://github.com/alphagov/govuk-frontend/blob/e248b4027102b2684f592a0501630075bdfa1fab/config/.sass-lint.yml#L222
      '/transition/': ['/all/']
    },
    // Disallow scheme relative URLs such as //www.gov.uk
    // https://stylelint.io/user-guide/rules/function-url-no-scheme-relative
    // Originates from: https://github.com/alphagov/govuk-frontend/blob/e248b4027102b2684f592a0501630075bdfa1fab/config/.sass-lint.yml#L230
    'function-url-no-scheme-relative': true,
    // Always require quotes in url function calls
    // https://stylelint.io/user-guide/rules/function-url-quotes
    // Originates from: https://github.com/alphagov/govuk-frontend/blob/e248b4027102b2684f592a0501630075bdfa1fab/config/.sass-lint.yml#L430
    'function-url-quotes': 'always',
    // Disallow absolute URLs with scheme other than data, assets should be local
    // https://stylelint.io/user-guide/rules/function-url-scheme-allowed-list
    // Originates from: https://github.com/alphagov/govuk-frontend/blob/e248b4027102b2684f592a0501630075bdfa1fab/config/.sass-lint.yml#L230
    'function-url-scheme-allowed-list': ['data'],
    // Disallow deep nesting, ideally only exceptions (such as .js-enabled) should
    // have nesting
    // https://stylelint.io/user-guide/rules/max-nesting-depth
    // Originates from: https://github.com/alphagov/govuk-frontend/blob/e248b4027102b2684f592a0501630075bdfa1fab/config/.sass-lint.yml#L136
    'max-nesting-depth': [
      2, {
        ignore: ['blockless-at-rules', 'pseudo-classes'],
      },
    ],
    // This rules attempts to prevent defining defining rules with a more
    // specific selector than a previous one, where they may override. This
    // is disables as it conflicts with our common usage of nesting rules
    // within a BEM modifier where a selector may be more or less specific
    // than a previous rule.
    // https://stylelint.io/user-guide/rules/no-descending-specificity
    'no-descending-specificity': null,
    // Disallow prefixing decimals with a 0
    // https://stylelint.io/user-guide/rules/number-leading-zero
    // Originates from: https://github.com/alphagov/govuk-frontend/blob/e248b4027102b2684f592a0501630075bdfa1fab/config/.sass-lint.yml#L119
    'number-leading-zero': 'never',
    // Require all class selectors to be in a hyphenated BEM format
    // https://stylelint.io/user-guide/rules/selector-class-pattern
    // Originates from: https://github.com/alphagov/govuk-frontend/blob/e248b4027102b2684f592a0501630075bdfa1fab/config/.sass-lint.yml#L39
    'selector-class-pattern': [
      // a loose interpretation on hyphenated BEM in order to allow BEM
      // style and govuk-! overrides
      /^[a-z]([a-z0-9-_!])*$/, {
        resolveNestedSelectors: true,
        message: 'Class names may only contain [a-z0-9-_!] characters and ' +
          'must start with [a-z]',
      },
    ],
    // Require any allowed id selectors to be in a hyphenated lowercase form
    // https://stylelint.io/user-guide/rules/selector-id-pattern
    // Originates from: https://github.com/alphagov/govuk-frontend/blob/e248b4027102b2684f592a0501630075bdfa1fab/config/.sass-lint.yml#L107
    'selector-id-pattern': [
      /^[a-z]([a-z0-9-])*$/, {
        resolveNestedSelectors: true,
        message: 'Ids may only contain [a-z0-9-] characters and ' +
          'must start with [a-z]',
      },
    ],
    // Disallow all ids in selectors
    // https://stylelint.io/user-guide/rules/selector-max-id
    // Originates from: https://github.com/alphagov/govuk-frontend/blob/e248b4027102b2684f592a0501630075bdfa1fab/config/.sass-lint.yml#L186
    'selector-max-id': 0,
    // Disallows qualifying a selector based on the element
    // https://stylelint.io/user-guide/rules/selector-no-qualifying-type
    // Originates from: https://github.com/alphagov/govuk-frontend/blob/e248b4027102b2684f592a0501630075bdfa1fab/config/.sass-lint.yml#L206
    'selector-no-qualifying-type': [
      true, {
        // allowed for input[type=button] and similar
        ignore: ['attribute']
      },
    ],
    // Require single colons for defining pseudo-elements
    // IE8 and below do not support the modern double colon approach. Although
    // few projects support IE8, we'd prefer to not exclude compatibility for
    // purely syntactic reasons.
    // https://stylelint.io/user-guide/rules/selector-pseudo-element-colon-notation
    'selector-pseudo-element-colon-notation': 'single',
    // Disallow redundant properties in rules (for example: margin: 1px 1px 1px;)
    // https://stylelint.io/user-guide/rules/shorthand-property-no-redundant-values
    // Originates from: https://github.com/alphagov/govuk-frontend/blob/e248b4027102b2684f592a0501630075bdfa1fab/config/.sass-lint.yml#L436
    'shorthand-property-no-redundant-values': true,
    // Disallow @debug
    // https://stylelint.io/user-guide/rules/at-rule-disallowed-list
    // Originates from: https://github.com/alphagov/govuk-frontend/blob/e248b4027102b2684f592a0501630075bdfa1fab/config/.sass-lint.yml#L166
    'at-rule-disallowed-list': ['debug'],
    // This is disabled for SCSS as it prevents SCSS specific @ rules (such as @if)
    // https://stylelint.io/user-guide/rules/at-rule-no-unknown
    'at-rule-no-unknown': null,
    // Require a new line after a @else { } statement
    // https://github.com/kristerkari/stylelint-scss/tree/master/src/rules/at-else-closing-brace-newline-after
    'scss/at-else-closing-brace-newline-after': 'always-last-in-chain',
    // Require a space after an @else {} before the next @else rule
    // https://github.com/kristerkari/stylelint-scss/tree/master/src/rules/at-else-closing-brace-space-after
    'scss/at-else-closing-brace-space-after': 'always-intermediate',
    // Disallow empty lines before an @else statement
    // https://github.com/kristerkari/stylelint-scss/tree/master/src/rules/at-else-empty-line-before
    'scss/at-else-empty-line-before': 'never',
    // Only allow @extend with a placeholder
    // https://github.com/kristerkari/stylelint-scss/blob/master/src/rules/at-extend-no-missing-placeholder
    // Originates from: https://github.com/alphagov/govuk-frontend/blob/e248b4027102b2684f592a0501630075bdfa1fab/config/.sass-lint.yml#L242
    'scss/at-extend-no-missing-placeholder': true,
    // https://github.com/kristerkari/stylelint-scss/tree/master/src/rules/at-function-pattern
    // Originates from: https://github.com/alphagov/govuk-frontend/blob/e248b4027102b2684f592a0501630075bdfa1fab/config/.sass-lint.yml#L88
    'scss/at-function-pattern': [
      /^_?([a-z0-9-])*$/, {
        message: 'Function names may only contain [a-z0-9-] characters and ' +
          'may start with an underscore',
      },
    ],
    // Require a new line character at the termination of a group of @if / @else
    // definitions
    // https://github.com/kristerkari/stylelint-scss/tree/master/src/rules/at-if-closing-brace-newline-after
    'scss/at-if-closing-brace-newline-after': 'always-last-in-chain',
    // Require a space between an @if {} ending and an @else beginning
    // https://github.com/kristerkari/stylelint-scss/tree/master/src/rules/at-if-closing-brace-space-after
    'scss/at-if-closing-brace-space-after': 'always-intermediate',
    // Disallow importing partials with a underscore prefix
    // https://github.com/kristerkari/stylelint-scss/tree/master/src/rules/at-import-no-partial-leading-underscore
    // Originates from: https://github.com/alphagov/govuk-frontend/blob/e248b4027102b2684f592a0501630075bdfa1fab/config/.sass-lint.yml#L46
    'scss/at-import-no-partial-leading-underscore': true,
    // Disallow importing partials with a underscore prefix
    // https://github.com/kristerkari/stylelint-scss/tree/master/src/rules/at-import-partial-extension
    // Originates from: https://github.com/alphagov/govuk-frontend/blob/e248b4027102b2684f592a0501630075bdfa1fab/config/.sass-lint.yml#L45
    'scss/at-import-partial-extension': 'never',
    // Disallow parenthesis when including a mixin with no parameters
    // https://github.com/kristerkari/stylelint-scss/tree/master/src/rules/at-mixin-argumentless-call-parentheses
    // Originates from: https://github.com/alphagov/govuk-frontend/blob/e248b4027102b2684f592a0501630075bdfa1fab/config/.sass-lint.yml#L48
    'scss/at-mixin-argumentless-call-parentheses': 'never',
    // https://github.com/kristerkari/stylelint-scss/tree/master/src/rules/at-mixin-pattern
    // Originates from: https://github.com/alphagov/govuk-frontend/blob/e248b4027102b2684f592a0501630075bdfa1fab/config/.sass-lint.yml#L125
    'scss/at-mixin-pattern': [
      /^_?([a-z0-9-])*$/, {
        message: 'Mixin names may only contain [a-z0-9-] characters and ' +
          'may start with an underscore'
      }
    ],
    // This lints that only @ rules known to SCSS are allowed
    // https://github.com/kristerkari/stylelint-scss/tree/master/src/rules/at-rule-no-unknown
    'scss/at-rule-no-unknown': true,
    // Disable CSS style comments in SCSS
    // https://github.com/kristerkari/stylelint-scss/blob/master/src/rules/comment-no-loud
    // Originates from: https://github.com/alphagov/govuk-frontend/blob/e248b4027102b2684f592a0501630075bdfa1fab/config/.sass-lint.yml#L162
    'scss/comment-no-loud': true,
    // https://github.com/kristerkari/stylelint-scss/tree/master/src/rules/dollar-variable-pattern
    // Originates from: https://github.com/alphagov/govuk-frontend/blob/e248b4027102b2684f592a0501630075bdfa1fab/config/.sass-lint.yml#L507
    'scss/dollar-variable-pattern': [
      /^_?([a-z0-9-])*$/, {
        message: 'Variable names may only contain [a-z0-9-] characters and ' +
          'may start with an underscore',
      },
    ],
    // Require spaces around operators
    // https://github.com/kristerkari/stylelint-scss/blob/master/src/rules/operator-no-unspaced
    // Originates from: https://github.com/alphagov/govuk-frontend/blob/e248b4027102b2684f592a0501630075bdfa1fab/config/.sass-lint.yml#L467
    'scss/operator-no-unspaced': true,
    // https://github.com/kristerkari/stylelint-scss/blob/master/src/rules/percent-placeholder-pattern
    // Originates from: https://github.com/alphagov/govuk-frontend/blob/e248b4027102b2684f592a0501630075bdfa1fab/config/.sass-lint.yml#L246
    'scss/percent-placeholder-pattern': [
      /^[a-z0-9-]*$/, {
        message: 'Placeholders may only contain [a-z0-9-] characters',
      },
    ],
    // Disable @import needing to be first declarations
    // @import has a different usage in SCSS to CSS and may be scoped or follow SCSS conditionals
    // https://stylelint.io/user-guide/rules/list/no-invalid-position-at-import-rule/
    'no-invalid-position-at-import-rule': null,
    'selector-no-qualifying-type': [
      true,
      {
        ignore: ["attribute", "class", "id"],
      },
    ],
    // 'lower' is the standard setting but not somethign we want
    'value-keyword-case': null,
    //we don't have autoprefixer
    'property-no-vendor-prefix': null,
  }
}