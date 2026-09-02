type HumanJudgeLabel = "supported" | "not_supported" | "partially_supported";

interface GenerationJudgeCalibrationCase {
    id: string,
    question_id: string,
    query: string,
    nugget: string,
    generated_answer: string,
    human_label: HumanJudgeLabel,
    human_reason: string
}

export const generation_judge_calibration_v1: GenerationJudgeCalibrationCase[] = [
    {
        id: "H01-1",
        question_id: "H01",
        query: "FastAPI 接收上传文件时，如果文件比较大，参数类型应该用 bytes 还是 UploadFile?",
        nugget: "文件比较大时应使用 `Annotated[UploadFile, File()]`。",
        generated_answer: `对于大文件，应该使用 \`UploadFile\` 而不是 \`bytes\`。 理由： - 上下文 [Source 1] 明确指出：“小文件, \`Annotated[UploadFile, File()]\`-大文件”，暗示大文件应使用 \`UploadFile\`。 - 上下文 [Source 2] 提到“传文件: \`Annotated[bytes, File()]\`-小文件, \`Annotated\`”，表明 \`bytes\` 适用于小文件，而大文件未被提及，但结合上下文逻辑，\`bytes\` 用于小文件，大文件应使用更合适的类型。 - \`UploadFile\` 是 FastAPI 中专门用于处理文件上传的类型，支持大文件的流式处理和内存管理，避免一次性加载整个文件到内存中。 因此，当文件较大时，参数类型应使用 \`UploadFile\`。`,
        human_label: "supported",
        human_reason: "Generated answer 明确回答大文件应使用 UploadFile 而不是 bytes，已经完整表达了该 nugget 在当前 query 下要求的核心事实."
    },
    {
        id: "H04-4",
        question_id: "H04",
        query: "一个 FastAPI endpoint 同时写了返回类型注解和 response_model, 实际返回的数据里还有模型之外的额外字段. 哪一个定义会优先控制最终响应, 这些额外字段会怎样?",
        nugget: "返回类型注解 `-> type` 表示真正的返回类型。",
        generated_answer: `\`response_model\` 会优先控制最终响应。根据上下文，\`response_model\` 负责校验和转换，如果返回的数据中包含模型之外的额外字段，这些多余的字段会被删除，最终响应只会包含 \`response_model\` 定义的字段。因此，这些额外字段不会出现在最终响应中。`,
        human_label: "not_supported",
        human_reason: "Generated answer 没有提及返回类型注解 `-> type`，因此该 nugget 中的事实完全没有被表达."
    },
    {
        id: "B04-1",
        question_id: "B04",
        query: "组件里的副作用是不是都应该放进 useEffect?用户点击按钮后发请求也一定要放进去吗?",
        nugget: "与组件渲染或状态变化绑定的副作用应使用 `useEffect`。",
        generated_answer: `组件里的副作用并不都必须放进 \`useEffect\` 里。根据上下文： - 和“组件渲染相关”的副作用（如数据获取、DOM 操作）→ 应该用 \`useEffect\`，并通过依赖数组控制其执行时机。 - 和“用户动作相关”的副作用（如用户点击按钮后发请求）→ 应该直接写在事件回调里（如 \`onClick\`、\`onSubmit\`）。 因此，用户点击按钮后发请求**不一定**要放进 \`useEffect\`，而是根据具体场景决定：如果是响应用户操作（如点击按钮），则应直接写在事件回调中。 结论： 不是所有副作用都必须放进 \`useEffect\`，用户点击按钮后发请求也**不一定**要放进 \`useEffect\`，而是应根据是否与组件渲染或用户动作相关来决定。`,
        human_label: "partially_supported",
        human_reason: "Generated answer 明确提到了与组件渲染相关的副作用应使用 useEffect，但没有表达与状态变化绑定的这一部分，因此只覆盖了 nugget 的部分事实."
    },
    {
        id: "B04-3",
        question_id: "B04",
        query: "组件里的副作用是不是都应该放进 useEffect?用户点击按钮后发请求也一定要放进去吗?",
        nugget: "`useEffect` 的执行可以通过依赖数组控制。",
        generated_answer: `组件里的副作用并不都必须放进 \`useEffect\` 里。根据上下文： - 和“组件渲染相关”的副作用（如数据获取、DOM 操作）→ 应该用 \`useEffect\`，并通过依赖数组控制其执行时机。 - 和“用户动作相关”的副作用（如用户点击按钮后发请求）→ 应该直接写在事件回调里（如 \`onClick\`、\`onSubmit\`）。 因此，用户点击按钮后发请求**不一定**要放进 \`useEffect\`，而是根据具体场景决定：如果是响应用户操作（如点击按钮），则应直接写在事件回调中。 结论： 不是所有副作用都必须放进 \`useEffect\`，用户点击按钮后发请求也**不一定**要放进 \`useEffect\`，而是应根据是否与组件渲染或用户动作相关来决定。`,
        human_label: "supported",
        human_reason: "Generated answer 明确指出 useEffect 可以通过依赖数组控制执行时机，完整表达了该 nugget 的事实."
    },
    {
        id: "B07-2",
        question_id: "B07",
        query: "SQLAlchemy 里我已经查询出了 Post, 之后才发现需要访问 post.tags, 异步环境下该怎么办?",
        nugget: "如果提前知道需要 tags，可以在查询时使用 `selectinload(Post.tags)`，或把关系设置为 `relationship(..., lazy=\"selectin\")`。",
        generated_answer: `在异步环境下，如果已经查询出了 Post 对象但后来才发现需要访问 \`post.tags\`，可以使用 \`await post.awaitable_attrs.tags\` 来延迟加载 \`tags\` 属性，从而避免触发惰性查询时因不在 IO 环境中而报错。 解决方法是： 使用 \`await post.awaitable_attrs.tags\` 在需要时动态加载 \`tags\`。 > 说明：该方法适用于在对象已加载后、临时需要访问其关系属性的情况，是 SQLAlchemy 异步支持中处理懒加载的推荐方式。 （注：前提是你已经使用了支持异步的 SQLAlchemy 版本，并且 \`tags\` 是通过 \`relationship\` 定义的。）`,
        human_label: "not_supported",
        human_reason: "Generated answer 只介绍了 `await post.awaitable_attrs.tags`，没有提及 `selectinload(Post.tags)` 或 `lazy=\"selectin\"` 这两种提前加载方式，因此该 nugget 的事实没有被表达."
    },
    {
        id: "B09-2",
        question_id: "B09",
        query: "正则表达式需要对很多字符串重复使用同一个 pattern 时，有什么方式可以避免每次都重新写 pattern?",
        nugget: "可以重复调用该 `Pattern` 对象的 `match`、`search`、`findall` 等方法。",
        generated_answer: `可以使用 \`re.compile(pattern)\` 将正则表达式编译为 Pattern 对象，之后就可以重复使用这个 Pattern 对象来调用 \`match\`、\`search\`、\`findall\` 等方法，从而避免每次都重新写 pattern。这种方式特别适合同一个 pattern 重复使用的情况。`,
        human_label: "supported",
        human_reason: "Generated answer 明确指出可以重复使用 Pattern 对象调用 `match`、`search`、`findall` 等方法，完整表达了该 nugget."
    },
    {
        id: "H07-3",
        question_id: "H07",
        query: "按照笔记里的 JWT 部分，生成 JWT 使用什么 Python 库？生成 secret key 的命令是什么? JWT 具体使用哪一种签名算法?",
        nugget: "现有 Markdown 文档没有说明 JWT 具体使用哪一种签名算法，因此无法确定该算法。",
        generated_answer: `生成 JWT 使用的 Python 库是 \`pyjwt\`。 生成 secret key 的命令是：\`python -c "import secrets; print(secrets.token_hex(32))"\`。 JWT 具体使用的是 HMAC 签名算法（虽然上下文中未明确说明算法名称，但根据 \`pyjwt\` 库的默认行为和常见实践，通常使用 HMAC-SHA256，且在未指定算法时默认为 HMAC-SHA256）。 注意：上下文未明确指出签名算法的名称，因此“JWT 具体使用哪一种签名算法”这一部分无法从上下文中直接确认，仅能基于常见实践推断。`,
        human_label: "partially_supported",
        human_reason: "Generated answer 明确承认上下文没有说明具体签名算法，表达了 nugget 的一部分；但随后又推测具体算法为 HMAC-SHA256，与“无法确定具体算法”这一结论发生冲突."
    },
    {
        id: "B01-1",
        question_id: "B01",
        query: "FastAPI 接收到登录请求后，是怎样验证用户并最终把 token 返回给前端的?",
        nugget: "通过表单取得用户名并在数据库中查找对应用户；用户不存在时报告错误。",
        generated_answer: `FastAPI接收到登录请求后，通过表单获取用户名和密码，然后在数据库中比对用户名是否存在，若存在则与密码的哈希值进行对比。如果用户名和密码一致，则生成一个token对象，其结构为 \`{access_token: str, token_type: "bearer"}\`，并返回给前端。该token通过HTTP请求头的 \`Authorization: Bearer \${token}\` 格式传递，由前端在后续请求中携带以进行身份验证。`,
        human_label: "partially_supported",
        human_reason: "Generated answer 表达了通过表单取得用户名并在数据库中查找用户，但没有表达用户不存在时应报告错误，因此只覆盖了 nugget 的前半部分."
    }
]
