import Link from "next/link";

export default function Page() {
    return (
        <main className="mx-auto max-w-6xl px-6 py-14 sm:py-20">
            <section className="max-w-3xl">
                <p className="mb-4 text-sm font-semibold text-slate-500">
                    AI Notes · Full-Stack AI Project
                </p>

                <h1 className="text-4xl font-semibold leading-tight tracking-tight text-slate-900 sm:text-5xl">
                    Technical notes powered by
                    a retrieval-augmented AI system.
                </h1>

                <p className="mt-6 max-w-2xl text-base leading-8 text-slate-600">
                    A full-stack application combining a searchable
                    knowledge base with Retrieval-Augmented Generation (RAG).
                    Explore published notes or ask questions grounded
                    in their content.
                </p>

                <div className="mt-8 flex flex-wrap gap-3">
                    <Link
                        href="/posts"
                        className="rounded-lg bg-slate-900 px-5 py-3
                                   text-sm font-medium text-white transition
                                   hover:bg-slate-700"
                    >
                        Browse Notes
                    </Link>

                    <Link
                        href="/rag"
                        className="rounded-lg border border-slate-300
                                   bg-white px-5 py-3 text-sm font-medium
                                   text-slate-700 transition hover:bg-slate-50"
                    >
                        Explore RAG Demo
                    </Link>
                </div>

                <p className="mt-3 text-xs text-slate-400">
                    Sign-in is currently required for live RAG queries.
                </p>
            </section>

            <section className="mt-16 grid grid-cols-1 gap-6 md:grid-cols-2">
                <article className="rounded-xl border border-slate-200 bg-white p-7 shadow-sm">
                    <h2 className="text-xl font-semibold text-slate-900">
                        Knowledge Base
                    </h2>

                    <p className="mt-3 text-sm leading-7 text-slate-600">
                        Browse technical articles with keyword search,
                        tag filtering, and organized Markdown content.
                    </p>

                    <Link
                        href="/posts"
                        className="mt-6 inline-block text-sm font-medium text-slate-900 hover:text-slate-600"
                    >
                        Explore notes →
                    </Link>
                </article>

                <article className="rounded-xl border border-slate-200 bg-white p-7 shadow-sm">
                    <h2 className="text-xl font-semibold text-slate-900">
                        RAG Question Answering
                    </h2>

                    <p className="mt-3 text-sm leading-7 text-slate-600">
                        Ask questions about published articles.
                        The system retrieves relevant content,
                        generates answers, and displays their sources.
                    </p>

                    <Link
                        href="/rag"
                        className="mt-6 inline-block text-sm font-medium text-slate-900 hover:text-slate-600"
                    >
                        Explore RAG →
                    </Link>
                </article>
            </section>

            <section className="mt-16 border-t border-slate-200 pt-10">
                <h2 className="text-xl font-semibold text-slate-900">
                    Built with
                </h2>

                <p className="mt-3 text-sm leading-7 text-slate-600">
                    Next.js · React · TypeScript · FastAPI ·
                    PostgreSQL · pgvector · Hybrid Search ·
                    Cross-Encoder Reranking
                </p>
            </section>
        </main>
    );
} 