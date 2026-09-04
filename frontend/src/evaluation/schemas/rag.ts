// RagResponse
export interface RagSection {
    heading: string,
    content: string
}

export interface RagSource {
    title: string,
    slug: string,
    section_list: RagSection[]
}

export interface RagResponse {
    answer: string,
    sources: RagSource[]
}