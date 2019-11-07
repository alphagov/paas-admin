declare module 'fnv-plus' {
  export function hash(input: string, bitlenght: 64): { hex: () => string};
}
