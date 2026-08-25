"use client"

import { useApiFetch } from "@/hooks/useApiFetch";
import { useState } from "react";

import type { RawRetrievedResult, EvaluationResponse } from "@/evaluation/schemas/evaluation_v1";
const benchmarkQuestions = [
    {
        id: "B01",
        query: "FastAPI 接收到登录请求后，是怎样验证用户并最终把 token 返回给前端的?",
        right_answer:"通过 form 获取 username,去数据库比对; 没有用户则报错,有用户则将表单密码和 hash 后的密码比对；不一致报错，一致则返回 {access_token: str, token_type: \"bearer\"}.",
        gold_section:"FastAPI(&Pydantic) > FastAPI > 类型声明 > 安全及校验"
    },
    {
        id: "B02",
        query: "我想限制哪些前端域名能够访问 FastAPI 后端，应该配置什么?",
        right_answer:"使用 CORSMiddleware, 先定义 origins, 然后通过 app.add_middleware(CORSMiddleware, allow_origins=origins, allow_credentials=True, allow_methods=['*'], allow_headers=['*']) 配置.",
        gold_section:"FastAPI(&Pydantic) > FastAPI > CORSMiddleware"
    },
    {
        id: "B03",
        query: "React 中我只想保存一个跨 render 持久存在的值，但修改它时不希望组件重新渲染，应该用什么?",
        right_answer:"使用 useRef。它可用于 DOM ref, 也可以作为跨 render 持久化的可变容器；修改 ref.current 不会触发 re-render.",
        gold_section:"Next.js > 基础知识 > 组件 > 状态(以及Hook) > useRef Hook"
    },
    {
        id: "B04",
        query: "组件里的副作用是不是都应该放进 useEffect?用户点击按钮后发请求也一定要放进去吗?",
        right_answer:"不是。与组件渲染或状态变化绑定的副作用使用 useEffect; 与用户动作相关的副作用可以直接放在 onClick、onSubmit 等事件回调里.",
        gold_section:"Next.js > 基础知识 > 组件 > 副作用(useEffect)"
    },
    {
        id: "B05",
        query: "在 TypeScript 中，为什么定义了 interface Post 之后, 程序运行时并不会检查接口?",
        right_answer:"interface Post 只告诉 TypeScript 编译器数据应该有什么形状和字段类型, 不会编译成 JavaScript, 因此运行时不存在这个 interface, 也不会检查数据是否真的是 Post.",
        gold_section:"JavaScript > TypeScript"
    },
    {
        id: "B06",
        query: "图片有阴影或者不同区域亮度差异很大时, 全局二值化效果不好, 可以换成什么方法?",
        right_answer:"可以使用 adaptiveThreshold。它按局部区域计算阈值, 支持均值法和高斯法, 通过 blockSize 决定邻域大小, 并用 C 调整阈值",
        gold_section:"OpenCV in Python > 图像二值化"
    },
    {
        id: "B07",
        query: "SQLAlchemy 里我已经查询出了 Post, 之后才发现需要访问 post.tags, 异步环境下该怎么办?",
        right_answer:"可以提前用 selectinload(Post.tags); 如果前面没有加载、后面临时需要, 可以 await post.awaitable_attrs.tags; 也可以在 relationship 上设置 lazy=\"selectin\".",
        gold_section:"SQL AND SQLAlchemy > SQLAlChemy > 异步 > 关于懒加载"
    },
    {
        id: "B08",
        query: "我只想让数据库事务在代码块正常结束时提交，发生异常时自动回滚，应该选 engine.connect() 还是 engine.begin()?",
        right_answer:"选 engine.begin()。它会自动开启事务，正常退出时提交, 出错时回滚; engine.connect() 更偏低层控制，需要手动处理事务.",
        gold_section:"SQL AND SQLAlchemy > SQLAlChemy > 连接"
    },
    {
        id: "B09",
        query: "正则表达式需要对很多字符串重复使用同一个 pattern 时，有什么方式可以避免每次都重新写 pattern?",
        right_answer:"可以使用 re.compile(pattern) 将正则表达式编译成 Pattern 对象，之后重复调用它的 match()、search()、findall() 等方法.",
        gold_section:"Python版本 > Regular Expression"
    },
    {
        id: "B10",
        query: "SQL 查询里 JOIN ... ON ... 中的 ON 到底负责什么，和 JOIN 本身分别起什么作用?",
        right_answer:"JOIN 根据关联条件把分散在不同表里的数据组合起来; ON 决定两张表中的哪些行应该互相连接。",
        gold_section:"SQL AND SQLAlchemy > SQL > 主要语句分类 > 数据连接"
    },
]

export default function Page(props: {}){
    const api = useApiFetch();
    const [error, setError] = useState("")
    const [evaluationResponses, setEvaluationResponses] = useState<Record<string, EvaluationResponse>>({});

    async function get_answer(query:string, id:string) {
        try {
        const res = await api("/api/v1/rag/evaluate", {
            method : "POST",
            headers: {"Content-Type": "application/json"},
            body: JSON.stringify({
                query
            })
        });
        const evaluationResponse: EvaluationResponse = res;
        setEvaluationResponses(prev => {
            return {
                ...prev,
                [id]: evaluationResponse
            }
        })} catch(err: any){
            setError(err.message ?? "Unknown Error");
        } finally {
        }
    }
    
    async function ask_all(){
        for (const question of benchmarkQuestions){
            await get_answer(question.query, question.id);
        }
    }

    function save_results(){
        const evaluationData = {
            cases: benchmarkQuestions.map((question:any) => ({
                id: question.id,
                query: question.query,
                gold_answer: question.right_answer,
                gold_section: question.gold_section,
                generated_answer: evaluationResponses[question.id].generated_answer,
                raw_results: evaluationResponses[question.id].raw_retrieved_results.map((raw_retrieved_result) => ({
                    rank:raw_retrieved_result.rank,
                    similarity: raw_retrieved_result.similarity,
                    post_id: raw_retrieved_result.post_id,
                    chunk_idx: raw_retrieved_result.chunk_idx,
                    title: raw_retrieved_result.title,
                    slug: raw_retrieved_result.slug,
                    heading_path: raw_retrieved_result.heading_path.toString(),
                    content: raw_retrieved_result.content
                }))
            }))
        };

        const jsonData = JSON.stringify(evaluationData, null, 2);
        const blob = new Blob([jsonData], {type: 'application/json'});

        const url = URL.createObjectURL(blob);

        const a  = document.createElement("a");
        a.href = url;
        a.download = "benchmark_v1_results.json";
        a.click()

        URL.revokeObjectURL(url);
    }

    return (
        <main className="max-w-5xl mx-auto p-8 space-y-6">
            <button
                className="border rounded px-4 py-2"
                onClick={e => ask_all()}
            >
                Ask all questions
            </button>
            {<button
                className="border rounded px-4 py-2"
                onClick={e => save_results()}
            >
                Generate JSON Results and Save
            </button>
            }   
            {benchmarkQuestions.map((question:any) => {
                return (
                    <div
                        key={question.id}
                        className="border rounded-lg p-5 space-y-4"
                    >
                        <p className="font-semibold text-lg">
                            {question.id}: {question.query}
                        </p>
                        <button
                            className="border rounded px-4 py-2"
                            onClick={e => get_answer(question.query, question.id)}
                        >
                            Ask this question
                        </button>
                        {/* answer part */}
                        {evaluationResponses[question.id] && (
                            <div className="border-t pt-4 space-y-4">
                                <div className="border rounded p-4 space-y-3">
                                    <h4 className="font-bold">The correct answer:</h4>
                                    <p>{question.right_answer}</p>
                                    <h4 className="font-bold">Gold Section:</h4>
                                    <p>{question.gold_section}</p>           

                                    {/* Generated answer part */}
                                    <div className="border rounded p-4 space-y-3">

                                        <h4 className="font-bold">Generated answer:</h4>
                                        <p>{evaluationResponses[question.id].generated_answer}</p>    

                                        <div className="border-l-4 pl-4 space-y-2">
                                            <h5>Raw retrieved results:</h5>
                                            {evaluationResponses[question.id].raw_retrieved_results.map(
                                                (raw_retrieved_result:RawRetrievedResult, index:number) => {
                                                return (
                                                    <div key={index}>
                                                        <h5>Rank: {raw_retrieved_result.rank}</h5>
                                                        <h5>Similarity: {raw_retrieved_result.similarity}</h5>
                                                        <h5>Post_id: {raw_retrieved_result.post_id}</h5>
                                                        <h5>Chunk_idx: {raw_retrieved_result.chunk_idx}</h5>
                                                        <h5>Title: {raw_retrieved_result.title}</h5>
                                                        <h5>Slug: {raw_retrieved_result.slug}</h5>
                                                        <h5>Heading_path: {raw_retrieved_result.heading_path}</h5>
                                                        <h5>Content: {raw_retrieved_result.content}</h5>                                                       
                                                    </div>
                                                )
                                            })}
                                        </div>
                                    </div> 
                                </div>  
                            </div>                            
                        )}
                    </div>
                )
            })}
        </main>        
    )
}