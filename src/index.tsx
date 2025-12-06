const { Render, useState, useEffect } = window.MiniReact;

const InnerFuncDemo = () => {
  const [count, setCount] = useState(0);
  console.log("inner函数组件1");
  useEffect(() => {
    console.log("useEffect inner函数组件1 count=", count);
    return () => {
      console.log("useEffect inner函数组件1 cleanup");
    };
  }, [count]);
  return (
    <div>
      <span>inner函数组件1</span>
      <br />
      <span>{count}</span>
      <button onClick={() => setCount(count + 1)}>增加</button>
      <button onClick={() => setCount(count - 1)}>减少</button>
    </div>
  );
};

const FuncDemo = () => {
  const [count, setCount] = useState(0);
  console.log("函数组件1 渲染");
  useEffect(() => {
    console.log("useEffect函数组件1");
    return () => {
      console.log("useEffect函数组件1 cleanup");
    };
  }, []);
  return (
    <div>
      <span>函数组件1</span>
      <br />
      <span>{count}</span>
      <button onClick={() => setCount(count + 1)}>增加</button>
      <button onClick={() => setCount(count - 1)}>减少</button>
      <div>
        <InnerFuncDemo />
      </div>
    </div>
  );
};
const FuncDemo2 = () => {
  const [count, setCount] = useState(0);
  useEffect(() => {
    console.log("useEffect函数组件2");
    return () => {
      console.log("useEffect函数组件2 cleanup");
    };
  }, []);
  return (
    <div>
      <span>函数组件2</span>
      <br />

      <span>{count}</span>
      <button onClick={() => setCount(count + 1)}>增加</button>
      <button onClick={() => setCount(count - 1)}>减少</button>
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
