import { Suspense } from "react"
import LoginClient from "./LoginClient";

export default function LoginPage() {
    return (
        <Suspense fallback={<main className="max-w-md mx-auto p-8">Loading...</main>}>
            <LoginClient />
        </Suspense>
    )
}