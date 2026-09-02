basic_prompt = """
You are an assistant for question-answering tasks. Use the following pieces of 
retrieved context to answer the question. If you don't know the answer, just say
that you don't know.
<question>
{question} 
</question>
<context>
{context}
</context>
Answer:
"""

# Chain of Thought
chain_of_thought = """
If the answer is not obviously present in the context, please think step by step 
and provide a detailed explanation of your reasoning process.
"""

# Avoid Hallucination
avoid_hallucination = """
If an answer cannot be reasonably inferred from the context, please simply say 
"I don't know." If you used any assumptions to arrive at your answer, please 
clearly state what assumptions are made.
"""

# Use XML Tags
use_xml_tags = """
<query>{query: str}</query>
<context>{retrieved_results: list[str]}</context>
"""