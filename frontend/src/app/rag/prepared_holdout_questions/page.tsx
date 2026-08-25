"use client"

import { apiFetch } from "@/lib/api";
import { useState } from "react";
interface RagSection {
    heading: string,
    content: string
}

interface RagSource {
    title: string,
    slug: string,
    section_list: RagSection[]
}

interface RagResponse {
    content_only_source_list: RagSource[],
    combined_source_list: RagSource[],
    content_only_answer: string,
    combined_answer: string
}

const holdoutQuestions = [
    {
        id: "H01",
        query: "FastAPI 接收上传文件时，如果文件比较大，参数类型应该用 bytes 还是 UploadFile?",
        right_answer:"大文件应使用 Annotated[UploadFile, File()]; Annotated[bytes, File()] 更适合小文件.",
    },
    {
        id: "H02",
        query: "JavaScript 调用 fetch() 后，在请求完成前和完成后分别得到什么类型的对象？完成后的对象里可以看哪些请求结果信息?",
        right_answer:"fetch() 本身返回 Promise; 完成后得到 Response 对象，其中包含 status、statusText、ok 等字段."
    },
    {
        id: "H03",
        query: "我在 Next.js 客户端组件里读取一个叫 API_SECRET 的环境变量，但没有给它加特殊前缀. 按照笔记里的规则，浏览器端能直接拿到它吗?",
        right_answer:"不能. 只有以 NEXT_PUBLIC 开头的环境变量才会被注入浏览器端代码.",
    },
    {
        id: "H04",
        query: "一个 FastAPI endpoint 同时写了返回类型注解和 response_model, 实际返回的数据里还有模型之外的额外字段. 哪一个定义会优先控制最终响应, 这些额外字段会怎样?",
        right_answer:"response_model 优先级更高，负责校验和转换，并会删除多余字段；返回类型注解表示实际返回类型.",
    },
    {
        id: "H05",
        query: "点击一个子元素时，我只想阻止外层元素绑定的点击处理函数一起触发，但不想取消这个元素原本的浏览器默认行为，应该调用哪个方法?",
        right_answer:"e.stopPropagation().e.preventDefault() 是阻止默认浏览器行为，不是阻止事件向外传播.",
    },
    {
        id: "H06",
        query: "Python 正则中，我只需要找到字符串中任意位置的第一个匹配，并希望拿到一个 Match 对象；不要求匹配必须从字符串开头开始。应该用哪个函数?",
        right_answer:"",
        
    },
    {
        id: "H07",
        query: "按照笔记里的 JWT 部分，生成 JWT 使用什么 Python 库？生成 secret key 的命令是什么? JWT 具体使用哪一种签名算法?",
        right_answer:"",
        
    },
    {
        id: "H08",
        query: "本地 PostgreSQL 服务默认监听哪个 TCP 端口?",
        right_answer:"",
        
    },
];

const baselineConfig = {
    metadata: {
        code_version: "8375a80",
        prompt_version: "v1",
        evaluation_config: "rag_dual_baseline_v1",
        embedding_config: {
            embedding_inputs: ["content", "heading_path+content"],
            name: "sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2",
            max_seq_len: 128
        },
        retrieval_config: {
            top_k: 3,
            similarity_method: "cos_similarity"
        },
        chunking_config: {
            method: "markdown-aware",
            chunk_overlap: 8
        },
        llm_config: {
            name: "qwen3:4b-instruct-2507-q4_K_M",
            options: {
                num_ctx: 4096, 
                temperature: 0,
                seed: 42
            }
        }
    },
}

export default function Page(props: {}){
    const [error, setError] = useState("")
    const [results, setResults] = useState<Record<string, RagResponse>>({});

    async function get_answer(query:string, id:string) {
         try {
            const res = await apiFetch("/api/v1/rag", {
                method : "POST",
                headers: {"Content-Type": "application/json"},
                body: JSON.stringify({
                    query
                })
            });
        const data: RagResponse = res;
        setResults(prev => {
            return {
                ...prev,
                [id]: data
            }
        })
        
        } catch(err: any){
            setError(err.message ?? "Unknown Error");
        } finally {
        }
    }
    
    async function ask_all(){
        for (const question of holdoutQuestions){
            await get_answer(question.query, question.id);
        }
    }

    function save_results(){
        const evaluationData = {
            cases: holdoutQuestions.map((question:any) => ({
                id: question.id,
                query: question.query,
                answer: question.right_answer,
                response: results[question.id]
            }))
        };

        const jsonData = JSON.stringify(evaluationData, null, 2);
        const blob = new Blob([jsonData], {type: 'application/json'});

        const url = URL.createObjectURL(blob);

        const a = document.createElement("a");
        a.href = url;
        a.download = "holdout_v1_dual_results.json";
        a.click()

        URL.revokeObjectURL(url);
    }

    function saveConfig(){
        const jsonData = JSON.stringify(baselineConfig, null, 2);
        const blob = new Blob([jsonData], {type: 'application/json'});

        const url = URL.createObjectURL(blob)

        const a = document.createElement("a");
        a.href = url;
        a.download = "baseline_dual_config.json";
        a.click();

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
            <button
                className="border rounded px-4 py-2"
                onClick={e => save_results()}
            >
                Generate JSON Results and Save
            </button>
            <button
                className="border rounded px-4 py-2"
                onClick={e => saveConfig()}
            >
                Save Config
            </button>
            {holdoutQuestions.map((question:any) => {
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
                        {results[question.id] && (
                            <div className="border-t pt-4 space-y-4">
                                <div className="border rounded p-4 space-y-3">
                                    <h4 className="font-bold">The correct answer:</h4>
                                    <p>{question.right_answer}</p>
                                    <h4 className="font-bold">The content only answer:</h4>
                                    <p>{results[question.id].content_only_answer}</p>
                                    <div className="border-l-4 pl-4 space-y-2">
                                        <h5>The content only sourceList:</h5>
                                        {results[question.id].content_only_source_list.map((rag_section:RagSource, index:number) => {
                                            return (
                                                <div key={index}>
                                                    <h5>Title: {rag_section.title}</h5>
                                                    <h5>Slug: {rag_section.slug}</h5>
                                                    {rag_section.section_list.map((rag_section:RagSection, index: number) => {
                                                        return (
                                                            <div key={index}>
                                                                <h5>Section {index + 1}:</h5>
                                                                <h5>{rag_section.heading}</h5>
                                                                <p className="whitespace-pre-wrap">
                                                                    {rag_section.content}
                                                                </p>
                                                            </div>
                                                        )
                                                    })}
                                                </div>
                                            )
                                        })}
                                    </div>
                                </div>
                                {/* Combined answer part */}
                                <div className="border rounded p-4 space-y-3">
                                    <h4 className="font-bold">The combined answer:</h4>
                                    <p>{results[question.id].combined_answer}</p>                               
                                    <div className="border-l-4 pl-4 space-y-2">
                                        <h5>The combined sourceList:</h5>
                                        {results[question.id].combined_source_list.map((rag_section:RagSource, index:number) => {
                                            return (
                                                <div key={index}>
                                                    <h5>Title: {rag_section.title}</h5>
                                                    <h5>Slug: {rag_section.slug}</h5>
                                                    {rag_section.section_list.map((rag_section:RagSection, index: number) => {
                                                        return (
                                                            <div key={index}>
                                                                <h5>Section {index + 1}:</h5>
                                                                <h5>{rag_section.heading}</h5>
                                                                <p className="whitespace-pre-wrap">
                                                                    {rag_section.content}
                                                                </p>
                                                            </div>
                                                        )
                                                    })}
                                                </div>
                                            )
                                        })}
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