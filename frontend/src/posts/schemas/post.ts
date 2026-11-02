// keep the same name with backend
export interface PostOut {
    id: number;
    slug: string;
    title: string;
    content_md: string;
    excerpt: string | null;
    is_published: boolean;
    tags: string[];
}

export interface ManagedPostOut extends PostOut {
    user_id: number;
    username: string;
    created_at: string
    updated_at: string
}