"use client";

import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import { Fragment } from "react";

export default function NavBar(){
  const {isLoggedIn, logout, ready} = useAuth();
  //避免初次渲染闪烁
  if(!ready) return null;

  return (
    <nav className="w-full p-4 border-b flex justify-between items-center text-sm">
      <Link href={"/posts"} className="font-medium">
        My Blog
      </Link>

      <div className="space-x-4">
        {isLoggedIn? (
          <Fragment>
            <Link href={"/new"} className="underline">New Post</Link>
            <button onClick={logout} className="underline">
              Logout
            </button>
          </Fragment>
        ): (
          <Link href={"/login"} className="underline">
             Login
          </Link>
        )}
      </div>
    </nav>
  )
}
