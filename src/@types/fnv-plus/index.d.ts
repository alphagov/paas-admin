declare module 'fnv-plus' {
  export function hash (input: string, bitlength: 64): { readonly hex: () => string }
}
