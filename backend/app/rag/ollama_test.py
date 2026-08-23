from ollama import AsyncClient
import asyncio
from llm import generate_answer
start = """You are answering a user's question using retrieved context.

Rules:
1. Use only the information provided in the context.
2. Do not use external knowledge or invent information.
3. If the context does not contain enough information to answer the question,
   say \"I don't know based on the provided context.\"
4. If only part of the question can be answered, answer the supported part
   and clearly state which part is not supported by the context.
5. If the sources conflict, clearly state the conflict instead of choosing
   or inventing an answer.

"""

user_query1 = "In Project Aurora, which database is used and how long are user sessions valid?"
context_1 = """[Source 1]
Heading: Project Aurora > Backend > Database
Content:
Project Aurora uses NebulaDB as its primary database.

[Source 2]
Heading: Project Aurora > Authentication > Sessions
Content:
User sessions in Project Aurora remain valid for 45 minutes after login.

[Source 3]
Heading: Project Aurora > Frontend
Content:
The frontend dashboard is built with the Luma framework."""

answer1 = """
Database: NebulaDB
Session validity: 45 minutes"""

user_query2 = "What backup schedule does Project Aurora use?"
context_2 = """[Source 1]
Heading: Project Aurora > Backend > Database
Content:
Project Aurora uses NebulaDB as its primary database.

[Source 2]
Heading: Project Aurora > Authentication
Content:
User sessions remain valid for 45 minutes after login.

[Source 3]
Heading: Project Aurora > Frontend
Content:
The frontend dashboard is built with the Luma framework."""

answer2 = "I don't know based on the provided context."

user_query3 = "Which database does Project Aurora use, and on which port does the database server run?"
context_3 = """[Source 1]
Heading: Project Aurora > Backend > Database
Content:
Project Aurora uses NebulaDB as its primary database.

[Source 2]
Heading: Project Aurora > Authentication
Content:
User sessions remain valid for 45 minutes after login.

[Source 3]
Heading: Project Aurora > Frontend
Content:
The frontend dashboard is built with the Luma framework."""

answer3 = """
Project Aurora uses NebulaDB as its database.
The provided context does not specify which port the database server runs on."""

user_query4 = "How long are user sessions valid in Project Aurora?"
context_4 = """[Source 1]
Heading: Project Aurora > Authentication > Session Policy
Content:
User sessions remain valid for 45 minutes after login.

[Source 2]
Heading: Project Aurora > Security > Session Configuration
Content:
User sessions remain valid for 90 minutes after login.

[Source 3]
Heading: Project Aurora > Backend > Database
Content:
Project Aurora uses NebulaDB as its primary database."""

answer4 = """
The provided sources conflict. Source 1 states that sessions are valid
for 45 minutes, while Source 2 states that they are valid for 90 minutes."""

prompt_text = (
        start
        + f"User question:\n{user_query4}\n\n"
        + f"Context:\n\n"
        + f"{context_4}\n\n"
    )

res = asyncio.run(generate_answer(prompt_text))
print(res)