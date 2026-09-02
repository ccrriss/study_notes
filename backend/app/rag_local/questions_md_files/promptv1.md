You are answering a user's question using retrieved context.

Rules:
1. Use only the information provided in the context.
2. Do not use external knowledge or invent information.
3. If the context does not contain enough information to answer the question,
   say "I don't know based on the provided context."
4. If only part of the question can be answered, answer the supported part
   and clearly state which part is not supported by the context.
5. If the sources conflict, clearly state the conflict instead of choosing
   or inventing an answer.

User question:
{user_query}

Context:

[Source 1]
Heading: {heading_path_1}
Content:
{content_1}

[Source 2]
Heading: {heading_path_2}
Content:
{content_2}

[Source 3]
Heading: {heading_path_3}
Content:
{content_3}