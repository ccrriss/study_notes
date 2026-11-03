"use client";

import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import { Fragment } from "react";

export default function NavBar(){
    const {isLoggedIn, logout, ready, username} = useAuth();
    //避免初次渲染闪烁
    if(!ready) return null;

    return (
        <nav className="border-b border-slate-200 bg-white">
            <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
                <Link href={"/"} className="text-lg font-semibold tracking-tight text-slate-900">
                    AI Notes
                </Link>

                <div className="flex items-center gap-5 text-sm text-slate-600">
                    <Link href="/posts" className="transition hover:text-slate-900">
                        Notes
                    </Link>

                    <Link href={"/rag"} className="transition hover:text-slate-900">
                        Rag Demo
                    </Link>

                    {isLoggedIn? (
                        <Fragment>
                        <Link href={"/posts/my-posts"} className="transition hover:text-slate-900">
                            My Posts
                        </Link>

                        <Link href={"/new"} className="rounded-lg bg-slate-900 px-3 py-2 font-medium text-white transition hover:bg-slate-700">
                            New Post
                        </Link>

                        {username && (
                            <span className="text-slate-400">{username}</span>
                        )}

                        <button onClick={logout} className="cursor-pointer transition hover:text-slate-900">
                            Logout
                        </button>
                        </Fragment>
                    ): (
                        <Link href={"/login"}>
                            Login
                        </Link>
                    )}
                </div>
            </div>
      </nav>
    )
}
