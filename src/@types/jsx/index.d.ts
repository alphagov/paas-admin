interface IFallbackImage extends React.SVGProps<SVGImageElement> {
  readonly src: string;
}

// tslint:disable-next-line:no-namespace
declare namespace JSX {
  // tslint:disable-next-line:interface-name
  interface IntrinsicElements {
    image: IFallbackImage;
  }
}
