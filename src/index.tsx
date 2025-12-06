const { Render } = window.MiniReact;

const FuncDemo = () => {
  return (
    <div>
      <span>函数组件1</span>
    </div>
  );
};
const FuncDemo2 = () => {
  return (
    <div>
      <span>函数组件2</span>
    </div>
  );
};
const App = (
  <div id="container">
    <span className="title">标题</span>
    <p className="content">正文内容</p>
    简单的文本内容
    <div>
      <FuncDemo />
      <FuncDemo2 />
    </div>
  </div>
);

Render(App, document.getElementById("root") as HTMLElement);
