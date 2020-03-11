declare module '*.scss' {
  const content: { readonly [className: string]: string };
  const process: any;
  export default content;
}
