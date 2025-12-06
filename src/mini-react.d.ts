declare const MiniReact: {
  createElement: (type: any, props?: any, ...children: any[]) => any;
  Render: (element: any, container: HTMLElement) => void;
};

interface Window {
  MiniReact: typeof MiniReact;
}
