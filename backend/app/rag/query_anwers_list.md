| #  | Query                                                                          | Right answer（按当前文档）                                                                                                                                                      | Gold section                                     |
| -- | ------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------ |
| 1  | **FastAPI 接收到登录请求后，是怎样验证用户并最终把 token 返回给前端的？**                                 | 通过 form 获取 username，去数据库比对；没有用户则报错，有用户则将表单密码和 hash 后的密码比对；不一致报错，一致则返回 `{access_token: str, token_type: "bearer"}`。                                                       | `FastAPI(&Pydantic) > FastAPI > 类型声明 > 安全及校验`    |
| 2  | **我想限制哪些前端域名能够访问 FastAPI 后端，应该配置什么？**                                          | 使用 `CORSMiddleware`，先定义 `origins`，然后通过 `app.add_middleware(CORSMiddleware, allow_origins=origins, allow_credentials=True, allow_methods=['*'], allow_headers=['*'])` 配置。 | `FastAPI(&Pydantic) > FastAPI > CORSMiddleware`  |
| 3  | **React 中我只想保存一个跨 render 持久存在的值，但修改它时不希望组件重新渲染，应该用什么？**                        | 使用 `useRef`。它可用于 DOM ref，也可以作为跨 render 持久化的可变容器；修改 `ref.current` 不会触发 re-render。                                                                                         | `Next.js > 基础知识 > 组件 > 状态(以及Hook) > useRef Hook` |
| 4  | **组件里的副作用是不是都应该放进 `useEffect`？用户点击按钮后发请求也一定要放进去吗？**                            | 不是。与组件渲染或状态变化绑定的副作用使用 `useEffect`；与用户动作相关的副作用可以直接放在 `onClick`、`onSubmit` 等事件回调里。                                                                                         | `Next.js > 基础知识 > 组件 > 副作用(useEffect)`           |
| 5  | **在 TypeScript 中，为什么定义了 `interface Post` 之后，程序运行时并不会检查接口？**                    | `interface Post` 只告诉 TypeScript 编译器数据应该有什么形状和字段类型，不会编译成 JavaScript，因此运行时不存在这个 interface，也不会检查数据是否真的是 `Post`。                                                             | `JavaScript > TypeScript`                        |
| 6  | **图片有阴影或者不同区域亮度差异很大时，全局二值化效果不好，可以换成什么方法？**                                     | 可以使用 `adaptiveThreshold`。它按局部区域计算阈值，支持均值法和高斯法，通过 `blockSize` 决定邻域大小，并用 `C` 调整阈值。                                                                                         | `OpenCV in Python > 图像二值化`                       |
| 7  | **SQLAlchemy 里我已经查询出了 `Post`，之后才发现需要访问 `post.tags`，异步环境下该怎么办？**                | 可以提前用 `selectinload(Post.tags)`；如果前面没有加载、后面临时需要，可以 `await post.awaitable_attrs.tags`；也可以在 relationship 上设置 `lazy="selectin"`。                                            | `SQL AND SQLAlchemy > SQLAlChemy > 异步 > 关于懒加载`   |
| 8  | **我只想让数据库事务在代码块正常结束时提交，发生异常时自动回滚，应该选 `engine.connect()` 还是 `engine.begin()`？** | 选 `engine.begin()`。它会自动开启事务，正常退出时提交，出错时回滚；`engine.connect()` 更偏低层控制，需要手动处理事务。                                                                                            | `SQL AND SQLAlchemy > SQLAlChemy > 连接`           |
| 9  | **正则表达式需要对很多字符串重复使用同一个 pattern 时，有什么方式可以避免每次都重新写 pattern？**                    | 可以使用 `re.compile(pattern)` 将正则表达式编译成 `Pattern` 对象，之后重复调用它的 `match()`、`search()`、`findall()` 等方法。                                                                         | `Python版本 > Regular Expression`                  |
| 10 | **SQL 查询里 `JOIN ... ON ...` 中的 `ON` 到底负责什么，和 JOIN 本身分别起什么作用？**                 | `JOIN` 根据关联条件把分散在不同表里的数据组合起来；`ON` 决定两张表中的哪些行应该互相连接。                                                                                                                      | `SQL AND SQLAlchemy > SQL > 主要语句分类 > 数据连接`       |

这 10 题我特意做了几种不同难度

比如第 2、9 题相对容易，因为答案 section 中有非常强的：

CORSMiddleware
re.compile

信号。

第 3、4、7、8 题属于比较典型的语义改写：

query 没直接照搬原文
↓
但意思和某个 section 高度对应

这类最适合检查 embedding retrieval。

第 1 和第 10 题则要求 section 中同时包含多个相关概念，不是靠一个关键词就能完全回答。

尤其第 6 题，我故意没有问：

threshold 和 adaptiveThreshold 有什么区别？

而是问实际情景：

“光照不均怎么办？”

如果它仍然能找到 Adaptive Threshold 那一段，就比较能说明 semantic retrieval 是在工作，而不只是关键词匹配。