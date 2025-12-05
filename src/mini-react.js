(function () {
    // 创建虚拟dom元素
    function createElement(type, props, ...children) {
        return {
            type, // 元素类型，可以是div,span,也可以是函数组件
            props: Object.assign(Object.assign({}, props), {
                // 处理子元素，
                children: children.map(child => {
                    const isTextNode = typeof child === "string" || typeof child === "number";
                    return isTextNode ? createTextElement(child) : child;
                })
            })
        };
    }
    /**
     * 文本元素没有props，nodeValue就是文本元素本身
     */
    function createTextElement(nodeValue) {
        return {
            type: "TEXT_ELEMENT",
            props: {
                nodeValue,
                children: []
            }
        };
    }
    /**
     * 创建fiber节点
     */
    let nextUnitOfWork = null // 下一个工作单元
    let wipRoot = null // 工作中的根 fiber
    let currentRoot = null // 上次提交的根fiber
    let deletions = null // 要删除的fiber节点数组

    /**
     * render阶段，将虚拟dom转为fiber数据结构，确定根fiber
     */
    function Render(element, container) {
        wipRoot = {
            dom: container,
            props: {
                children: [element]
            },
            alternate: currentRoot,// 旧的fiber节点
        }
        // 根fiber节点就是下一个要开始工作的fiber节点
        nextUnitOfWork = wipRoot // 开始工作循环
    }

    /**
     * 
     * 通过时间分片，将react element转化成fiber节点
     * 这个过程叫reconcile 
     */
    function workloop(deadline) {
        let shouldYield = false//是否让出控制权
        // 工作节点不为空，且不需要让出控制权，则循环将react element转成fiber节点
        while (nextUnitOfWork && !shouldYield) {
            // 处理当前的工作单元
            nextUnitOfWork = performUnitOfWork(nextUnitOfWork);
            // 如果剩余时间不足1ms，让出控制权
            shouldYield = deadline.timeRemaining() < 1
        }
        // 如果没有需要处理的工作单元了,
        // 进入commit阶段，将fiber挂载到真实的dom上
        if (!nextUnitOfWork && wipRoot) {
            commitRoot();
        }
        requestIdleCallback(workloop);

    }
    requestIdleCallback(workloop);

    /**
     * 构建fiber节点
     */
    function performUnitOfWork(fiber) {

        // 深度优先遍历，先遍历子节点
        if (fiber.child) {
            return fiber.child
        }
        let nextFiber = fiber
        while (nextFiber) {

            // 遍历兄弟节点
            if (nextFiber.sibling) {
                return nextFiber.sibling
            }
            // 回溯，遍历父节点的兄弟节点
            nextFiber = nextFiber.return
        }

    }

    window.MiniReact = {
        createElement,
        Render,
    }
})()