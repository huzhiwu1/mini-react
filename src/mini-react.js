(function () {
  // 创建虚拟dom元素
  function createElement(type, props, ...children) {
    return {
      type, // 元素类型，可以是div,span,也可以是函数组件
      props: Object.assign(Object.assign({}, props), {
        // 处理子元素，
        children: children.map((child) => {
          const isTextNode =
            typeof child === "string" || typeof child === "number";
          return isTextNode ? createTextElement(child) : child;
        }),
      }),
    };
  }
  /**
   * 文本元素没有props，nodeValue就是文本元素本身
   */
  function createTextElement(nodeValue) {
    return {
      type: "TEXT_ELEMENT",
      props: {
        nodeValue, // 在文本元素中，nodeValue就是文本元素本身
        children: [],
      },
    };
  }
  /**
   * 创建fiber节点
   */
  let nextUnitOfWork = null; // 下一个工作单元
  let wipRoot = null; // 工作中的根 fiber
  let currentRoot = null; // 上次提交的根fiber
  let deletions = null; // 要删除的fiber节点数组

  /**
   * render阶段，将虚拟dom转为fiber数据结构，确定根fiber
   */
  function Render(element, container) {
    wipRoot = {
      dom: container,
      props: {
        children: [element],
      },
      alternate: currentRoot, // 旧的fiber节点
    };
    deletions = []; // 要删除的fiber节点数组
    // 根fiber节点就是下一个要开始工作的fiber节点
    nextUnitOfWork = wipRoot; // 开始工作循环
  }

  /**
   *
   * 通过时间分片，将react element转化成fiber节点
   * 这个过程叫reconcile
   */
  function workloop(deadline) {
    let shouldYield = false; //是否让出控制权
    // 工作节点不为空，且不需要让出控制权，则循环将react element转成fiber节点
    while (nextUnitOfWork && !shouldYield) {
      // 处理当前的工作单元
      nextUnitOfWork = performUnitOfWork(nextUnitOfWork);
      // 如果剩余时间不足1ms，让出控制权
      shouldYield = deadline.timeRemaining() < 1;
    }

    // 如果没有需要处理的工作单元了,
    // 进入commit阶段，将fiber挂载到真实的dom上
    // 这里的commitRoot也是循环，将所有的fiber节点挂载到真实的dom上
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
    // 是否是函数组件
    const isFunctionComponent = fiber.type instanceof Function;
    if (isFunctionComponent) {
      updateFunctionComponent(fiber);
    } else {
      updateHostComponent(fiber);
    }
    // 深度优先遍历，先遍历子节点
    if (fiber.child) {
      return fiber.child;
    }
    let nextFiber = fiber;
    while (nextFiber) {
      // 遍历兄弟节点
      if (nextFiber.sibling) {
        return nextFiber.sibling;
      }
      // 回溯，遍历父节点的兄弟节点
      nextFiber = nextFiber.return;
    }
  }

  // 函数组件的根fiber节点
  let wipFiber = null;
  let stateHookIndex = 0;
  // 处理函数组件
  function updateFunctionComponent(fiber) {
    wipFiber = fiber;
    // 因为是从根节点wipRoot往下寻找的，所以每次stateHookIndex都要归0
    stateHookIndex = 0;
    wipFiber.stateHooks = [];
    wipFiber.effectHooks = [];
    // 调用函数组件，获取返回的虚拟dom元素
    const children = [fiber.type(fiber.props)];
    reconcileChildren(fiber, children);
  }
  // 处理原生标签组件
  function updateHostComponent(fiber) {
    // 如果当前fiber节点没有真实的dom节点，则创建一个
    if (!fiber.dom) {
      fiber.dom = createDom(fiber);
    }
    // 处理子节点
    reconcileChildren(fiber, fiber.props.children);
  }

  // 创建真实dom节点
  function createDom(fiber) {
    const dom =
      fiber.type === "TEXT_ELEMENT"
        ? document.createTextNode("")
        : document.createElement(fiber.type);

    updateDom(dom, {}, fiber.props);
    return dom;
  }

  const isEvent = (key) => key.startsWith("on");
  const isNew = (prev, next) => (key) => prev[key] !== next[key];
  const isProperty = (key) => key !== "children" && !isEvent(key);
  // 旧的属性
  const isGone = (prev, next) => (key) => !(key in next);

  // 更新dom节点的属性
  function updateDom(dom, prevProps, nextProps) {
    // 删除旧的事件和已经更新事件函数的 事件监听器
    Object.keys(prevProps)
      .filter(isEvent)
      .filter(
        // 新的props已经删除了这个事件，或者事件函数发生了变化
        (key) => !(key in nextProps) || isNew(prevProps, nextProps)(key)
      )
      .forEach((name) => {
        const eventType = name.toLowerCase().substring(2);
        dom.removeEventListener(eventType, prevProps[name]);
      });

    // 删除旧的属性
    Object.keys(prevProps)
      .filter(isProperty)
      .filter(isGone(prevProps, nextProps))
      .forEach((name) => {
        dom[name] = "";
      });

    // 设置新的属性 或 更新的属性
    Object.keys(nextProps)
      .filter(isProperty)
      .filter(isNew(prevProps, nextProps))
      .forEach((name) => {
        dom[name] = nextProps[name];
      });

    // 添加新的事件监听器，或更新事件函数
    Object.keys(nextProps)
      .filter(isEvent)
      .filter(isNew(prevProps, nextProps))
      .forEach((name) => {
        const eventType = name.toLocaleLowerCase().substring(2);
        dom.addEventListener(eventType, nextProps[name]);
      });
  }

  // 处理原始标签的子节点，转为fiber节点
  function reconcileChildren(wipFiber, elements) {
    let index = 0; // 当前处理的子节点索引
    let oldFiber = wipFiber.alternate?.child; // 旧的子节点fiber
    let prevSibling = null; // 上一个兄弟节点fiber
    // 需要遍历的子节点不为空，或者旧的fiber节点不为空
    // 注意这里的oldFiber可能为undefined或null，要用!=进行判断
    while (index < elements.length || oldFiber != null) {
      const element = elements[index];
      let newFiber = null;
      // 是否是相同类型
      const sameType = oldFiber?.type === element?.type;

      // 组件类型相同，直接复制旧的fiber属性
      if (sameType) {
        newFiber = {
          type: oldFiber.type,
          dom: oldFiber.dom,
          props: element.props,
          return: wipFiber, // 父级fiber
          alternate: oldFiber, // 旧的fiber
          // sibling: // 这里还不知兄弟节点是什么，等index往后走，才知道、
          effectTag: "UPDATE",
        };
      }
      // 组件类型不同，但是有element
      if (element && !sameType) {
        newFiber = {
          type: element.type,
          dom: null, //需要去createDom那创建
          props: element.props,
          return: wipFiber,
          alternate: null, // 由于旧的节点跟当前节点类型不同，这里不能将旧节点赋值给alternate
          effectTag: "PLACEMENT",
        };
      }

      // 如果旧的fiber存在，而与当前的element的type不同，旧的fiber需要删除
      if (oldFiber && !sameType) {
        oldFiber.effectTag = "DELETION";
        deletions.push(oldFiber);
      }
      // 由于需要递归对比新旧两个fiber树，这里oldFiber需要更新为同一层级的兄弟节点
      if (oldFiber) {
        oldFiber = oldFiber.sibling;
      }
      // 更新fiber的child属性，child是子节点的第一个fiber节点
      if (index === 0) {
        wipFiber.child = newFiber;
      } else if (element) {
        prevSibling.sibling = newFiber;
      }

      prevSibling = newFiber;
      index++;
    }
  }

  function commitRoot() {
    // 把要删除的fiber节点删除
    deletions.forEach(commitWork);
    // 从根fiber节点开始挂载
    commitWork(wipRoot.child);
    commitEffectHooks();
    // 挂载完成，更新currentRoot,currentRoot就是下一次更新的旧节点
    currentRoot = wipRoot;
    wipRoot = null; // 需要更新的根节点为null
    deletions = []; // 需要删除的fiber节点为空
  }

  function commitWork(fiber) {
    // 没有fiber节点
    if (!fiber) {
      return;
    }
    // 找到根dom节点进行挂载
    let domParentFiber = fiber.return;
    while (!domParentFiber.dom) {
      domParentFiber = domParentFiber.return;
    }
    let domParent = domParentFiber.dom;
    // 挂载新节点
    if (fiber.effectTag === "PLACEMENT" && fiber.dom != null) {
      domParent.appendChild(fiber.dom);
      // 更新节点
    } else if (fiber.effectTag === "UPDATE" && fiber.dom != null) {
      updateDom(fiber.dom, fiber.alternate.props, fiber.props);
      // 删除dom节点
    } else if (fiber.effectTag === "DELETION") {
      commitDeletion(fiber, domParent);
    }
    // 深度优先搜索，递归子节点和兄弟节点
    commitWork(fiber.child);
    commitWork(fiber.sibling);
  }
  function commitDeletion(fiber, domParent) {
    if (fiber.dom) {
      domParent.removeChild(fiber.dom);
    } else {
      commitDeletion(fiber.child, domParent);
    }
  }

  // 处理useState函数
  function useState(initialState) {
    let currentFiber = wipFiber; // 正在工作的fiber节点
    // 旧的stateHook是什么
    let oldStateHook = currentFiber?.alternate?.stateHooks[stateHookIndex];

    // 构建新的stateHook
    const stateHook = {
      // 上一次渲染中触发的 setState(()=>1) setState(()=>2)等都会以队列的方式放入queue中
      queue: oldStateHook ? oldStateHook?.queue : [],
      // 状态延续上一次渲染中的状态或初始化状态
      state: oldStateHook ? oldStateHook.state : initialState,
    };

    // 处理还没有执行的stateHook queue
    stateHook.queue.forEach((action) => {
      stateHook.state = action(stateHook.state);
    });

    stateHook.queue = [];
    // 增加stateHookIndex，用于下一个stateHook的索引
    stateHookIndex++;
    wipFiber.stateHooks.push(stateHook);

    function setState(action) {
      const isFunction = typeof action === "function";
      stateHook.queue.push(isFunction ? action : () => action);
      // 以整棵树的根为起点重新渲染，不能以当前函数组件为根
      // 使用上次提交的根（currentRoot）来构建新的工作根
      wipRoot = {
        dom: currentRoot.dom,
        props: currentRoot.props,
        alternate: currentRoot,
      };
      // 重置删除队列，避免遗留的删除标记影响本次提交
      deletions = [];
      // 下一个要处理的 unit of work 是新的根
      nextUnitOfWork = wipRoot;
    }

    return [stateHook.state, setState];
  }

  function useEffect(callback, deps) {
    const effectHook = {
      callback,
      deps,
      cleanup: undefined, // 执行完callback后才能拿到
    };
    // 将effectHook放入当前的函数组件的fiber节点
    wipFiber.effectHooks.push(effectHook);
  }

  function commitEffectHooks() {
    function runCleanup(fiber) {
      if (!fiber) return;
      // 遍历旧的fiber节点上的hooks
      fiber.alternate?.effectHooks?.forEach((hook, index) => {
        const deps = fiber.effectHooks[index].deps;
        // 没有依赖 或 依赖变更，执行cleanup
        if (!hook.deps || !isDepsEqual(hook.deps, deps)) {
          hook.cleanup?.();
        }
      });
      // 递归处理子节点
      runCleanup(fiber.child);
      // 递归处理兄弟节点
      runCleanup(fiber.sibling);
    }
    function run(fiber) {
      // fiber节点为空
      if (!fiber) {
        return;
      }
      // 函数fiber上才有effectHooks
      fiber.effectHooks?.forEach((newHook, index) => {
        // 如果没有旧的fiber节点，证明是初始化执行useEffect
        if (!fiber.alternate) {
          newHook.cleanup = newHook.callback();
          return;
        }
        // 依赖为空
        if (!newHook.deps) {
          newHook.cleanup = newHook.callback();
        }
        // 有依赖，对比依赖是否变化
        if (newHook.deps.length > 0) {
          const oldHook = fiber.alternate?.effectHooks[index];

          if (!isDepsEqual(oldHook.deps, newHook.deps)) {
            newHook.cleanup = newHook.callback();
          }
        }
      });

      // 递归处理子节点
      run(fiber.child);
      // 兄弟节点
      run(fiber.sibling);
    }
    runCleanup(wipRoot);
    run(wipRoot);
  }

  function isDepsEqual(deps, newDeps) {
    if (deps.length !== newDeps.length) {
      return false;
    }

    for (let i = 0; i < deps.length; i++) {
      if (deps[i] !== newDeps[i]) {
        return false;
      }
    }
    return true;
  }

  window.MiniReact = {
    createElement,
    Render,
    useState,
    useEffect,
  };
})();
