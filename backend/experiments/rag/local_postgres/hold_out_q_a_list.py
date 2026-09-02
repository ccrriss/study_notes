q1 = "FastAPI 接收上传文件时，如果文件比较大，参数类型应该用 bytes 还是 UploadFile?"
q2 = "JavaScript 调用 fetch() 后，在请求完成前和完成后分别得到什么类型的对象? 完成后的对象里可以看哪些请求结果信息?"
q3 = "我在 Next.js 客户端组件里读取一个叫 API_SECRET 的环境变量，但没有给它加特殊前缀。按照笔记里的规则，浏览器端能直接拿到它吗?"
q4 = "一个 FastAPI endpoint 同时写了返回类型注解和 response_model, 实际返回的数据里还有模型之外的额外字段。哪一个定义会优先控制最终响应, 这些额外字段会怎样?"
q5 = "点击一个子元素时，我只想阻止外层元素绑定的点击处理函数一起触发，但不想取消这个元素原本的浏览器默认行为，应该调用哪个方法?"
q6 = "Python 正则中，我只需要找到字符串中任意位置的第一个匹配，并希望拿到一个 Match 对象；不要求匹配必须从字符串开头开始。应该用哪个函数?"
q7 = "按照笔记里的 JWT 部分，生成 JWT 使用什么 Python 库？生成 secret key 的命令是什么?JWT 具体使用哪一种签名算法?"
q8 = "本地 PostgreSQL 服务默认监听哪个 TCP 端口?"

a1 = '大文件应使用 Annotated[UploadFile, File()]; Annotated[bytes, File()] 更适合小文件'
a2 = "fetch() 本身返回 Promise; 完成后得到 Response 对象，其中包含 status、statusText、ok 等字段"
a3 = "不能。只有以 NEXT_PUBLIC 开头的环境变量才会被注入浏览器端代码"
a4 = "response_model 优先级更高，负责校验和转换，并会删除多余字段；返回类型注解表示实际返回类型"
a5 = "e.stopPropagation()。e.preventDefault() 是阻止默认浏览器行为，不是阻止事件向外传播"
a6 = "re.search()。re.match() 要求从开头匹配;re.findall() 返回所有匹配组成的 list"
a7 = '使用 pyjwt; secret key 可用 python -c "import secrets; print(secrets.token_hex(32))" 生成。笔记没有说明具体使用哪一种签名算法'
a8 = "文档中没有提供这个信息"


def get_hold_out_q_a_list():
    q_a_list = []
    for i in range(1, 9):
        q = globals()[f"q{i}"]
        a = globals()[f"a{i}"]

        q_a_list.append({"q":q, "a": a})
    return q_a_list