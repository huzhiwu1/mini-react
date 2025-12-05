type HtmlProps = {
  id?: string;
  className?: string;
  style?: any;
  children?: any;
  [key: string]: any;
};

declare namespace JSX {
  interface Element {}
  interface IntrinsicElements {
    div: HtmlProps;
    span: HtmlProps;
    p: HtmlProps;
    [elemName: string]: any;
  }
}

declare const MiniReact: {
  createElement: (type: any, props?: any, ...children: any[]) => any;
};
