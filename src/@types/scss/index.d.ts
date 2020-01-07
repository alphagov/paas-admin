declare module '*.scss' {
  const content: { [className: string]: string };
  const process: any;
  export default content;
}
