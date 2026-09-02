q1 = "FastAPI 接收到登录请求后，是怎样验证用户并最终把 token 返回给前端的?"
q2 = "我想限制哪些前端域名能够访问 FastAPI 后端，应该配置什么?"
q3 = "React 中我只想保存一个跨 render 持久存在的值，但修改它时不希望组件重新渲染，应该用什么?"
q4 = "组件里的副作用是不是都应该放进 useEffect?用户点击按钮后发请求也一定要放进去吗?"
q5 = "在 TypeScript 中，为什么定义了 interface Post 之后，程序运行时并不会检查接口?"
q6 = "图片有阴影或者不同区域亮度差异很大时，全局二值化效果不好，可以换成什么方法?"
q7 = "SQLAlchemy 里我已经查询出了 Post, 之后才发现需要访问 post.tags, 异步环境下该怎么办?"
q8 = "我只想让数据库事务在代码块正常结束时提交，发生异常时自动回滚，应该选 engine.connect() 还是 engine.begin()?"
q9 = "正则表达式需要对很多字符串重复使用同一个 pattern 时, 有什么方式可以避免每次都重新写 pattern?"
q10 = "SQL 查询里 JOIN ... ON ... 中的 ON 到底负责什么，和 JOIN 本身分别起什么作用"
a1 = '通过 form 获取 username, 去数据库比对; 没有用户则报错, 有用户则将表单密码和 hash 后的密码比对；不一致报错，一致则返回 {access_token: str, token_type: "bearer"}'
a2 = "使用 CORSMiddleware, 先定义 origins, 然后通过 app.add_middleware(CORSMiddleware, allow_origins=origins, allow_credentials=True, allow_methods=['*'], allow_headers=['*']) 配置"
a3 = "使用 useRef。它可用于 DOM ref, 也可以作为跨 render 持久化的可变容器；修改 ref.current 不会触发 re-render"
a4 = "不是。与组件渲染或状态变化绑定的副作用使用 useEffect; 与用户动作相关的副作用可以直接放在 onClick、onSubmit 等事件回调里"
a5 = "interface Post 只告诉 TypeScript 编译器数据应该有什么形状和字段类型，不会编译成 JavaScript, 因此运行时不存在这个 interface, 也不会检查数据是否真的是 Post"
a6 = "可以使用 adaptiveThreshold。它按局部区域计算阈值, 支持均值法和高斯法, 通过 blockSize 决定邻域大小，并用 C 调整阈值"
a7 = '可以提前用 selectinload(Post.tags)；如果前面没有加载、后面临时需要，可以 await post.awaitable_attrs.tags;也可以在 relationship 上设置 lazy="selectin"'
a8 = "选 engine.begin()。它会自动开启事务, 正常退出时提交, 出错时回滚; engine.connect() 更偏低层控制，需要手动处理事务"
a9 = "可以使用 re.compile(pattern) 将正则表达式编译成 Pattern 对象，之后重复调用它的 match()、search()、findall() 等方法"
a10 = "JOIN 根据关联条件把分散在不同表里的数据组合起来; ON 决定两张表中的哪些行应该互相连接"

def get_q_a_list():
    q_a_list = []
    for i in range(1, 11):
        q = globals()[f"q{i}"]
        a = globals()[f"a{i}"]

        q_a_list.append({"q":q, "a": a})
    return q_a_list