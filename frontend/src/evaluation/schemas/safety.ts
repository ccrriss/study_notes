export interface SafetyCheckQuestion {
    id: string,
    category: "out of scope" | "prompt injection" | "prompt leakage" | "context injection" | "malformed input",
    query: string,
    expected_behavior: string
}