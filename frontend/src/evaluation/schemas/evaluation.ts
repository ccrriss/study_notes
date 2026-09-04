// This is stable structure and can be imported to be used by versions of evaluation v*

// Modelruntime Metadata
export interface ModelOptions {
    temperature: number,
    seed: number,
    num_ctx: number
}

export interface ModelRuntimeData {
    model: string,
    prompt_version: string,
    options: ModelOptions
}

export interface RuntimeMetadata {
    code_version: string,
    generation: ModelRuntimeData,
    judge: ModelRuntimeData
}