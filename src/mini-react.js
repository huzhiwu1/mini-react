(function () {
    // 将jsx类型转化为虚拟dom
    function createElement(type, props, ...children) {
        return {
            type,// 元素类型，可以是div,span,也可以是函数组件
            props: {
                ...props,//元素属性
                // 处理子元素，
                children: children.map(child => {
                    const isTextNode = typeof child === "string" || typeof child === "number"
                    return isTextNode ? createTextElement(child) : child
                })
            }
        }
    }

    function createTextElement(nodeValue) {
        return {
            type: "TEXT_ELEMENT",
            props: {
                nodeValue,
                children: []
            }
        }
    }

    window.miniReact = {
        createElement,
    }
})()