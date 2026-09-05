// 12 questions for comparing 4B and 8B qwen model

export const generation_judge_model_comparison_v1 = [{
    id: "B01-2",
    question_id: "B01",
    query: "FastAPI 接收到登录请求后，是怎样验证用户并最终把 token 返回给前端的?",
    nugget: "用户存在时，将哈希后的表单密码用于比对；密码不一致时报告错误。",
    generated_answer: `FastAPI接收到登录请求后，通过表单获取用户名和密码，然后在数据库中比对用户名是否存在，若存在则与密码的哈希值进行对比。如果用户名和密码一致，则生成一个token对象，其结构为 \`{access_token: str, token_type: "bearer"}\`，并返回给前端。该token通过HTTP请求头的 \`Authorization: Bearer \${token}\` 格式传递，由前端在后续请求中携带以进行身份验证。`,
    human_label: "partially_supported",
    human_reason: "Generated answer 提到了密码哈希值的比对，但没有说明密码不一致时应报告错误，因此只覆盖了 nugget 的部分事实."
},
{
    id: "H04-4-current",
    question_id: "H04",
    query: "一个 FastAPI endpoint 同时写了返回类型注解和 response_model, 实际返回的数据里还有模型之外的额外字段. 哪一个定义会优先控制最终响应, 这些额外字段会怎样?",
    nugget: "返回类型注解 `-> type` 表示真正的返回类型。",
    generated_answer: `\`response_model\` 会优先控制最终响应。根据上下文，\`response_model\` 负责校验和转换，如果返回的数据中包含模型之外的额外字段，这些多余字段会被删除，不会出现在最终响应中。因此，最终响应将只包含 \`response_model\` 定义的字段，额外字段不会被保留。`,
    human_label: "not_supported",
    human_reason: "Generated answer 没有提到任何关于返回类型注解 `-> type` 的内容，因此该 nugget 的事实没有被表达."
},
{
    id: "B07-2-current",
    question_id: "B07",
    query: "SQLAlchemy 里我已经查询出了 Post, 之后才发现需要访问 post.tags, 异步环境下该怎么办?",
    nugget: "如果提前知道需要 tags，可以在查询时使用 `selectinload(Post.tags)`，或把关系设置为 `relationship(..., lazy=\"selectin\")`。",
    generated_answer: `在异步环境下，如果已经查询出了 Post 但后来才发现需要访问 \`post.tags\`，可以使用 \`await post.awaitable_attrs.tags\` 来触发懒加载，避免因不在 IO 环境中而报错。

解决方法是：**使用 \`await post.awaitable_attrs.tags\`**，这会在异步环境中安全地延迟加载 \`tags\` 属性。

> 说明：根据 [Source 1]，在异步环境下，如果想访问对象属性（如 \`post.tags\`），会触发惰性查询，此时会报错，因为不在 IO 环境中。解决方法之一是使用 \`await post.awaitable_attrs.tags\`，该方法允许在异步环境中延迟加载属性。

注意：此方法适用于已经查询出对象后临时需要访问其关系属性的情况。如果提前知道需要 \`tags\`，也可以使用 \`selectinload(Post.tags)\` 进行预加载。`,
    human_label: "partially_supported",
    human_reason: "Generated answer 明确提到了提前知道需要 tags 时可以使用 `selectinload(Post.tags)`，但没有提及 `relationship(..., lazy=\"selectin\")`，因此只覆盖了 nugget 的一部分事实."
},
{
    id: "B10-1",
    question_id: "B10",
    query: "SQL 查询里 JOIN ... ON ... 中的 ON 到底负责什么，和 JOIN 本身分别起什么作用?",
    nugget: "`JOIN` 通过关联条件把原本分散在不同表里的数据组合起来。",
    generated_answer: `在 SQL 查询中：

- **JOIN** 本身的作用是“把原本分散在不同表里的数据组合起来”，它是一种数据连接操作，用于将两个或多个表根据某种关系合并成一个结果集。常见的 JOIN 类型如 INNER JOIN（交集）、LEFT OUTER JOIN（左外联）等，都是通过 JOIN 实现数据的组合。

- **ON** 的作用是“决定两张表的哪些行应该互相连接”，即指定连接条件。它定义了在 JOIN 操作中，如何匹配两个表中的行（例如，基于主键、外键或其他字段的相等关系）。

简而言之：
- **JOIN** 是“做什么”——把表的数据组合在一起；
- **ON** 是“怎么组合”——定义匹配条件，决定哪些行可以连接。

两者配合使用，例如：\`SELECT * FROM table1 INNER JOIN table2 ON table1.id = table2.id\`，表示“从 table1 和 table2 中，通过 id 相等的条件连接数据”。`,
    human_label: "supported",
    human_reason: "Generated answer 明确说明 JOIN 的作用是把原本分散在不同表里的数据组合起来，完整表达了该 nugget."
},
{
    id: "H02-2",
    question_id: "H02",
    query: "JavaScript 调用 fetch() 后，在请求完成前和完成后分别得到什么类型的对象？完成后的对象里可以看哪些请求结果信息?",
    nugget: "请求完成后得到 `Response` 对象。",
    generated_answer: `JavaScript 调用 fetch() 后：

- 在请求完成前，得到的是一个 \`Promise\` 对象。
- 在请求完成后，该 Promise 被解析为一个 \`Response\` 对象。

完成后的 \`Response\` 对象中可以查看的请求结果信息包括：
- \`status\`（HTTP 状态码）
- \`statusText\`（HTTP 状态码对应的文本描述）
- \`ok\`（布尔值，表示请求是否成功，即状态码在 200-299 范围内）

这些信息均来自提供的上下文内容。`,
    human_label: "supported",
    human_reason: "Generated answer 明确说明请求完成后 Promise 会被解析为 Response 对象，与 nugget 表达的事实一致."
},
{
    id: "H03-1",
    question_id: "H03",
    query: "我在 Next.js 客户端组件里读取一个叫 API_SECRET 的环境变量，但没有给它加特殊前缀. 按照笔记里的规则，浏览器端能直接拿到它吗?",
    nugget: "浏览器端不能直接拿到 `API_SECRET`，因为只有以 `NEXT_PUBLIC` 开头的环境变量才会被注入浏览器端代码，而 `API_SECRET` 没有该前缀。",
    generated_answer: `不会。按照笔记里的规则，只有以 \`NEXT_PUBLIC\` 开头的环境变量才会被注入到浏览器端代码中。你没有给 \`API_SECRET\` 加 \`NEXT_PUBLIC\` 前缀，因此它不会被注入到浏览器端，浏览器端无法直接拿到这个环境变量。

所以，在 Next.js 客户端组件中读取 \`API_SECRET\` 时，浏览器端是无法直接拿到它的。`,
    human_label: "supported",
    human_reason: "Generated answer 明确说明浏览器端无法取得 API_SECRET，并准确说明原因是它没有 NEXT_PUBLIC 前缀，完整表达了 nugget."
},
{
    id: "H05-1",
    question_id: "H05",
    query: "点击一个子元素时，我只想阻止外层元素绑定的点击处理函数一起触发，但不想取消这个元素原本的浏览器默认行为，应该调用哪个方法?",
    nugget: "应调用 `e.stopPropagation()`；它会阻止绑定在外层标签上的事件处理函数触发，但不会取消元素原本的浏览器默认行为。",
    generated_answer: `应该调用 \`e.stopPropagation()\` 方法。

解释：根据上下文 [Source 1]，\`e.stopPropagation()\` 的作用是“阻止触发绑定在外层标签上的事件处理函数”，这正好符合你想要“只阻止外层元素绑定的点击处理函数一起触发”的需求。而你不想取消浏览器默认行为，因此不需要使用 \`e.preventDefault()\`，因为它会阻止浏览器的默认行为。所以，正确的方法是 \`e.stopPropagation()\`。`,
    human_label: "supported",
    human_reason: "Generated answer 明确指出应使用 e.stopPropagation()，并说明了它阻止事件传播但不需要取消默认行为的作用，完整表达了 nugget."
},
{
    id: "B02-1",
    question_id: "B02",
    query: "我想限制哪些前端域名能够访问 FastAPI 后端，应该配置什么?",
    nugget: "应配置 `CORSMiddleware`.",
    generated_answer: `我 don't know based on the provided context.`,
    human_label: "not_supported",
    human_reason: "Generated answer 表示无法回答问题，没有表达应配置 CORSMiddleware 这一事实，因此不支持该 nugget."
},
{
    id: "B02-2",
    question_id: "B02",
    query: "我想限制哪些前端域名能够访问 FastAPI 后端，应该配置什么?",
    nugget: "把允许访问后端的前端域名放入 `origins`，并通过 `allow_origins=origins` 传给中间件。",
    generated_answer: `我 don't know based on the provided context.`,
    human_label: "not_supported",
    human_reason: "Generated answer 表示无法回答问题，没有提及 origins 或 allow_origins=origins，因此不支持该 nugget."
},
{
    id: "B06-2",
    question_id: "B06",
    query: "图片有阴影或者不同区域亮度差异很大时, 全局二值化效果不好, 可以换成什么方法?",
    nugget: "它会根据 `blockSize` 为各局部区域计算阈值，并可选择均值法 `ADAPTIVE_THRESH_MEAN_C` 或高斯法 `ADAPTIVE_THRESH_GAUSSIAN_C`。",
    generated_answer: `当图片有阴影或者不同区域亮度差异很大时，全局二值化效果不好，可以换成**自适应阈值化（adaptive thresholding）**方法。

理由：根据[Source 1]和[Source 3]，全局阈值（如\`cv2.threshold\`）使用一个固定的阈值，对光照不均匀或有阴影的图像效果不佳；而自适应阈值（如\`cv2.adaptiveThreshold\`）会根据局部区域的亮度自适应地计算阈值，更适合处理光照不均匀或有阴影的图像。[Source 3]明确指出“全局阈值...如果有阴影或者光照不均匀会导致阴影覆盖的白色也被转为黑色”，因此推荐使用自适应阈值方法。`,
    human_label: "partially_supported",
    human_reason: "Generated answer 表达了自适应阈值会根据局部区域计算阈值这一部分，但没有提及 blockSize，也没有说明 ADAPTIVE_THRESH_MEAN_C 和 ADAPTIVE_THRESH_GAUSSIAN_C 两种方法，因此只部分支持该 nugget."
},
{
    id: "B08-3",
    question_id: "B08",
    query: "我只想让数据库事务在代码块正常结束时提交，发生异常时自动回滚，应该选 engine.connect() 还是 engine.begin()?",
    nugget: "`engine.connect()` 不会自动提交或回滚，需要手动控制。",
    generated_answer: `你应该选择 \`engine.begin()\`。

理由：根据上下文，\`engine.begin()\` 会自动开启事务，并在正常结束时提交、发生异常时自动回滚，符合你“只想让数据库事务在代码块正常结束时提交，发生异常时自动回滚”的需求。而 \`engine.connect()\` 不会自动开启事务，也不自动提交或回滚，需要手动管理，不适合你的场景。

对比信息来自 [Source 1] 和 [Source 2]，明确指出：
- \`engine.begin()\` ✅ 自动提交或出错时回滚，推荐用于一般查询/写入（安全简洁）。
- \`engine.connect()\` ❌ 不自动开启事务，❌ 不自动提交/回滚，适合低层控制和复杂逻辑。

因此，为满足你的需求，应选 \`engine.begin()\`。`,
    human_label: "supported",
    human_reason: "Generated answer 明确说明 engine.connect() 不会自动提交或回滚，需要手动管理，完整表达了 nugget."
},
{
    id: "B10-2",
    question_id: "B10",
    query: "SQL 查询里 JOIN ... ON ... 中的 ON 到底负责什么，和 JOIN 本身分别起什么作用?",
    nugget: "`ON` 决定两张表中的哪些行应该互相连接。",
    generated_answer: `在 SQL 查询中：

- **JOIN** 本身的作用是“把原本分散在不同表里的数据组合起来”，它是一种数据连接操作，用于将两个或多个表根据某种关系合并成一个结果集。常见的 JOIN 类型如 INNER JOIN（交集）、LEFT OUTER JOIN（左外联）等，都是通过 JOIN 实现数据的组合。

- **ON** 的作用是“决定两张表的哪些行应该互相连接”，即指定连接条件。它定义了在 JOIN 操作中，如何匹配两个表中的行（例如，基于主键、外键或其他字段的相等关系）。

简而言之：
- **JOIN** 是“做什么”——把表的数据组合在一起；
- **ON** 是“怎么组合”——定义匹配条件，决定哪些行可以连接。

两者配合使用，例如：\`SELECT * FROM table1 INNER JOIN table2 ON table1.id = table2.id\`，表示“从 table1 和 table2 中，通过 id 相等的条件连接数据”。`,
    human_label: "supported",
    human_reason: "Generated answer 明确说明 ON 用于指定连接条件并决定两张表中的哪些行互相连接，完整表达了 nugget."
}
]