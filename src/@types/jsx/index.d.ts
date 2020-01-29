interface IFallbackImage extends React.SVGProps<SVGImageElement> {
  readonly src: string;
}

// tslint:disable-next-line:no-namespace
declare namespace JSX {
  interface IntrinsicElements {
    image: IFallbackImage;
  }
}
