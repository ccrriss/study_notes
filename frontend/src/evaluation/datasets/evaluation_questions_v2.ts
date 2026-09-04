interface BaseEvaluationQuestion {
    id: string,
    query: string,
    gold_answer: string,
    expected_behavior: "answer" | "refuse",
    gold_section?: string
}

interface AnswerQuestion extends BaseEvaluationQuestion {
    expected_behavior: "answer",
    vital_nuggets: string[],
    ok_nuggets?: string[]
}

interface RefusalQuestion extends BaseEvaluationQuestion {
    expected_behavior: "refuse"
}

export type EvaluationQuestion = AnswerQuestion | RefusalQuestion;

export const evaluationQuestions: EvaluationQuestion[] = [
    {
        id: "H01",
        query: "FastAPI 接收上传文件时，如果文件比较大，参数类型应该用 bytes 还是 UploadFile?",
        gold_answer: "文件比较大时应使用 `Annotated[UploadFile, File()]`；`Annotated[bytes, File()]` 适用于小文件。",
        expected_behavior: "answer",
        vital_nuggets: [
            "文件比较大时应使用 `Annotated[UploadFile, File()]`。"
        ],
        ok_nuggets: [
            "`Annotated[bytes, File()]` 适用于小文件。"
        ]
    },
    {
        id: "H02",
        query: "JavaScript 调用 fetch() 后，在请求完成前和完成后分别得到什么类型的对象？完成后的对象里可以看哪些请求结果信息?",
        gold_answer: "调用 `fetch()` 后先得到 `Promise` 对象；请求完成后得到 `Response` 对象，其中可以查看 `status`、`statusText`、`ok` 等字段。",
        expected_behavior: "answer",
        vital_nuggets: [
            "调用 `fetch()` 后先得到 `Promise` 对象。",
            "请求完成后得到 `Response` 对象。",
            "可以在 `Response` 对象中查看 `status`、`statusText`、`ok` 等请求结果信息。"
        ]
    },
    {
        id: "H03",
        query: "我在 Next.js 客户端组件里读取一个叫 API_SECRET 的环境变量，但没有给它加特殊前缀. 按照笔记里的规则，浏览器端能直接拿到它吗?",
        gold_answer: "不能。在 Next.js 中，只有以 `NEXT_PUBLIC` 开头的环境变量才会被注入浏览器端代码；`API_SECRET` 没有该前缀，因此浏览器端不能直接拿到它。",
        expected_behavior: "answer",
        vital_nuggets: [
            "浏览器端不能直接拿到 `API_SECRET`，因为只有以 `NEXT_PUBLIC` 开头的环境变量才会被注入浏览器端代码，而 `API_SECRET` 没有该前缀。"
        ]
    },
    {
        id: "H04",
        query: "一个 FastAPI endpoint 同时写了返回类型注解和 response_model, 实际返回的数据里还有模型之外的额外字段. 哪一个定义会优先控制最终响应, 这些额外字段会怎样?",
        gold_answer: "`response_model` 的优先级更高，它负责响应数据的校验和转换；模型之外的多余字段会被删除。返回类型注解 `-> type` 表示真正的返回类型。",
        expected_behavior: "answer",
        vital_nuggets: [
            "`response_model` 的优先级高于返回类型注解，并控制最终响应。",
            "模型之外的多余字段会被删除。"
        ],
        ok_nuggets: [
            "`response_model` 负责响应数据的校验和转换。",
            "返回类型注解 `-> type` 表示真正的返回类型。"
        ]
    },
    {
        id: "H05",
        query: "点击一个子元素时，我只想阻止外层元素绑定的点击处理函数一起触发，但不想取消这个元素原本的浏览器默认行为，应该调用哪个方法?",
        gold_answer: "应调用 `e.stopPropagation()`，它会阻止触发绑定在外层标签上的事件处理函数，但不会取消元素原本的浏览器默认行为。",
        expected_behavior: "answer",
        vital_nuggets: [
            "应调用 `e.stopPropagation()`；它会阻止绑定在外层标签上的事件处理函数触发，但不会取消元素原本的浏览器默认行为。"
        ]
    },
    {
        id: "H06",
        query: "Python 正则中，我只需要找到字符串中任意位置的第一个匹配，并希望拿到一个 Match 对象；不要求匹配必须从字符串开头开始。应该用哪个函数?",
        gold_answer: "应使用 `re.search(pattern, string, flags=0)`。它不要求从字符串开头匹配，并返回一个 `Match` 对象或 `None`，最多返回一个匹配。",
        expected_behavior: "answer",
        vital_nuggets: [
            "应使用 `re.search(pattern, string, flags=0)`；它不要求从字符串开头匹配，并返回第一个匹配的 `Match` 对象或 `None`。"
        ]
    },
    {
        id: "H07",
        query: "按照笔记里的 JWT 部分，生成 JWT 使用什么 Python 库？生成 secret key 的命令是什么? JWT 具体使用哪一种签名算法?",
        gold_answer: "笔记中写明生成 JWT 使用 `pyjwt` 库，生成 secret key 的命令是 `python -c \"import secrets; print(secrets.token_hex(32))\"`。但笔记没有说明 JWT 具体使用哪一种签名算法，因此无法根据现有 Markdown 文档确定该部分。",
        expected_behavior: "answer",
        vital_nuggets: [
            "生成 JWT 使用 `pyjwt` 库。",
            "生成 secret key 的命令是 `python -c \"import secrets; print(secrets.token_hex(32))\"`。",
            "现有 Markdown 文档没有说明 JWT 具体使用哪一种签名算法，因此无法确定该算法。"
        ]
    },
    {
        id: "H08",
        query: "本地 PostgreSQL 服务默认监听哪个 TCP 端口?",
        gold_answer: "现有 Markdown 文档内容不足以回答该问题。",
        expected_behavior: "refuse"
    },
    {
        id: "B01",
        query: "FastAPI 接收到登录请求后，是怎样验证用户并最终把 token 返回给前端的?",
        gold_answer: "先通过表单取得用户名并到数据库中比对；用户不存在就报错。用户存在时，将哈希后的表单密码用于比对，密码不一致就报错；一致时向前端返回 token 对象，结构为 `{access_token: str, token_type: \"bearer\"}`。",
        expected_behavior: "answer",
        vital_nuggets: [
            "通过表单取得用户名并在数据库中查找对应用户；用户不存在时报告错误。",
            "用户存在时，将哈希后的表单密码用于比对；密码不一致时报告错误。",
            "密码一致时向前端返回结构为 `{access_token: str, token_type: \"bearer\"}` 的 token 对象。"
        ],
        gold_section: "FastAPI(&Pydantic) > FastAPI > 类型声明 > 安全及校验"
    },
    {
        id: "B02",
        query: "我想限制哪些前端域名能够访问 FastAPI 后端，应该配置什么?",
        gold_answer: "应配置 `CORSMiddleware`，把允许访问后端的前端域名放入 `origins`，并通过 `allow_origins=origins` 传给中间件。",
        expected_behavior: "answer",
        vital_nuggets: [
            "应配置 `CORSMiddleware`."
        ],
        ok_nuggets: [
            "把允许访问后端的前端域名放入 `origins`，并通过 `allow_origins=origins` 传给中间件。"
        ],
        gold_section: "FastAPI(&Pydantic) > FastAPI > CORSMiddleware"
    },
    {
        id: "B03",
        query: "React 中我只想保存一个跨 render 持久存在的值，但修改它时不希望组件重新渲染，应该用什么?",
        gold_answer: "应使用 `useRef`。它提供一个可变且能跨 render 持久化的容器，修改 `ref.current` 不会触发组件重新渲染。",
        expected_behavior: "answer",
        vital_nuggets: [
            "应使用 `useRef`；它提供一个能跨 render 持久化的可变容器，修改 `ref.current` 不会触发组件重新渲染。"
        ],
        gold_section: "Next.js > 基础知识 > 组件 > 状态(以及Hook) > useRef Hook"
    },
    {
        id: "B04",
        query: "组件里的副作用是不是都应该放进 useEffect?用户点击按钮后发请求也一定要放进去吗?",
        gold_answer: "不是。与组件渲染或状态变化绑定的副作用应使用 `useEffect`，并通过依赖数组控制；与用户动作相关的副作用应直接写在 `onClick`、`onSubmit` 等事件回调里，因此点击按钮后发请求不一定要放进 `useEffect`。",
        expected_behavior: "answer",
        vital_nuggets: [
            "与组件渲染或状态变化绑定的副作用应使用 `useEffect`。",
            "与用户动作相关的副作用应直接写在 `onClick`、`onSubmit` 等事件回调里，因此点击按钮后发请求不一定要放进 `useEffect`。"
        ],
        ok_nuggets: [
            "`useEffect` 的执行可以通过依赖数组控制。"
        ],
        gold_section: "Next.js > 基础知识 > 组件 > 副作用(useEffect)"
    },
    {
        id: "B05",
        query: "在 TypeScript 中，为什么定义了 interface Post 之后, 程序运行时并不会检查接口?",
        gold_answer: "因为 `interface Post` 不会被编译成 JavaScript 代码，运行时不存在这个接口。它只用于告诉 TypeScript 编译器数据应具有哪些字段和类型，运行时不会检查数据是否为 `Post` 类型。",
        expected_behavior: "answer",
        vital_nuggets: [
            "`interface Post` 不会被编译成 JavaScript 代码，因此运行时不存在该接口，也不会检查数据是否为 `Post` 类型。"
        ],
        ok_nuggets: [
            "`interface Post` 只用于告诉 TypeScript 编译器数据应具有哪些字段和类型。"
        ],
        gold_section: "JavaScript > TypeScript"
    },
    {
        id: "B06",
        query: "图片有阴影或者不同区域亮度差异很大时, 全局二值化效果不好, 可以换成什么方法?",
        gold_answer: "可以改用 `cv2.adaptiveThreshold()` 进行局部自适应阈值二值化。它会根据 `blockSize` 为各局部区域计算阈值，可选择均值法 `ADAPTIVE_THRESH_MEAN_C` 或高斯法 `ADAPTIVE_THRESH_GAUSSIAN_C`。",
        expected_behavior: "answer",
        vital_nuggets: [
            "可以改用 `cv2.adaptiveThreshold()` 进行局部自适应阈值二值化。"
        ],
        ok_nuggets: [
            "它会根据 `blockSize` 为各局部区域计算阈值，并可选择均值法 `ADAPTIVE_THRESH_MEAN_C` 或高斯法 `ADAPTIVE_THRESH_GAUSSIAN_C`。"
        ],
        gold_section: "OpenCV in Python"
    },
    {
        id: "B07",
        query: "SQLAlchemy 里我已经查询出了 Post, 之后才发现需要访问 post.tags, 异步环境下该怎么办?",
        gold_answer: "对于已经查询出的 `Post`，之后临时需要加载 `post.tags` 时，应使用 `await post.awaitable_attrs.tags`。如果提前知道需要 tags，可以在查询时使用 `selectinload(Post.tags)`，也可以把关系设置为 `relationship(..., lazy=\"selectin\")`。",
        expected_behavior: "answer",
        vital_nuggets: [
            "对于已经查询出的 `Post`，之后临时加载 `post.tags` 时应使用 `await post.awaitable_attrs.tags`。"
        ],
        ok_nuggets: [
            "如果提前知道需要 tags，可以在查询时使用 `selectinload(Post.tags)`，或把关系设置为 `relationship(..., lazy=\"selectin\")`。"
        ],
        gold_section: "SQL AND SQLAlchemy > SQLAlChemy > 异步 > 关于懒加载"
    },
    {
        id: "B08",
        query: "我只想让数据库事务在代码块正常结束时提交，发生异常时自动回滚，应该选 engine.connect() 还是 engine.begin()?",
        gold_answer: "应选择 `engine.begin()`。它会自动开启事务，在代码块正常结束时自动提交，发生异常时自动回滚；`engine.connect()` 不会自动提交或回滚，需要手动控制。",
        expected_behavior: "answer",
        vital_nuggets: [
            "应选择 `engine.begin()`；它会在代码块正常结束时自动提交，并在发生异常时自动回滚。"
        ],
        ok_nuggets: [
            "`engine.begin()` 会自动开启事务。",
            "`engine.connect()` 不会自动提交或回滚，需要手动控制。"
        ],
        gold_section: "SQL AND SQLAlchemy > SQLAlChemy > 连接"
    },
    {
        id: "B09",
        query: "正则表达式需要对很多字符串重复使用同一个 pattern 时，有什么方式可以避免每次都重新写 pattern?",
        gold_answer: "可以使用 `re.compile(pattern)` 将正则表达式编译为 `Pattern` 对象，然后重复调用该对象的 `match`、`search`、`findall` 等方法。",
        expected_behavior: "answer",
        vital_nuggets: [
            "可以使用 `re.compile(pattern)` 将正则表达式编译为可重复使用的 `Pattern` 对象。"
        ],
        ok_nuggets: [
            "可以重复调用该 `Pattern` 对象的 `match`、`search`、`findall` 等方法。"
        ],
        gold_section: "Python版本 > Regular Expression"
    },
    {
        id: "B10",
        query: "SQL 查询里 JOIN ... ON ... 中的 ON 到底负责什么，和 JOIN 本身分别起什么作用?",
        gold_answer: "`JOIN` 通过关联条件把原本分散在不同表里的数据组合起来；`ON` 用来决定两张表中的哪些行应该互相连接。",
        expected_behavior: "answer",
        vital_nuggets: [
            "`JOIN` 通过关联条件把原本分散在不同表里的数据组合起来。",
            "`ON` 决定两张表中的哪些行应该互相连接。"
        ],
        gold_section: "SQL AND SQLAlchemy > SQL > 主要语句分类"
    }
];
