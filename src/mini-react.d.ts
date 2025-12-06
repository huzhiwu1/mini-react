declare const MiniReact: {
  createElement: (type: any, props?: any, ...children: any[]) => any;
  Render: (element: any, container: HTMLElement) => void;
  useState: (initialState: any) => [any, (action: any) => void];
};

interface Window {
  MiniReact: typeof MiniReact;
}
