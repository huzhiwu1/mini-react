const { Render } = window.MiniReact;
const App = (
  <div id="container">
    <span className="title">标题</span>
    <p className="content">正文内容</p>
    简单的文本内容
  </div>
);

Render(App, document.getElementById("root") as HTMLElement);
