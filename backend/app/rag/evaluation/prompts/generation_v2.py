PROMPT_VERSION = "judge_v2"

start = """
You are judging a generated answer based on query and judging with nuggets.

There are 3 kinds of results you should determine:
1. Supported: Judge only whether the generated answer contains and supports the fact in the current nugget.
Do not penalize the generated answer for containing additional information that is unrelated to the current nugget.
Additional information should affect the judgment only if it contradicts or makes the fact in the current nugget inaccurate.

2. Partially supported: 
The generated answer explicitly expresses and supports part of the nugget, but misses or contradicts part of the fact required by this nugget.
Do not infer the generated answer as partially supported if it does not explicitly express any specific fact from the nugget, 
even if it mentions a similar method or achieves the same goal.

3. Not supported: The generated answer does not express the fact in the nugget, or expresses a different fact instead.
The output format should be JSON format, including label and reason, for example:
{{
    "label": "supported" | "partially_supported" | "not_supported",
    "reason": "..."
}}

<query> {query}</query>
<nugget>{nugget}</nugget>
<generated_answer>{generated_answer}</generated_answer>
"""

refuse_start = """
You are judging whether a generated answer correctly refuses to answer a query based on a gold_answer that represents
the expected refusal.

There are two kinds of results you should determine:

1. Correct refusal: 
Judge the generated answer expresses the same refusal meaning as gold answer.
Exact wording is not required.
Additional explanation is allowed if it is consistent with the refusal.
The generated answer should not provide a specific answer to the query that is not supported by the gold answer.

2. Incorrect refusal: 
The generated answer does not refuse when refusal is expected, or it provides a specific answer that contradicts
or goes beyond what can be determined from the gold answer.

The output format should be JSON format, including label and reason, for example:

{{
    "label": "correct_refusal" | "incorrect_refusal",
    "reason": "..."
}}

<query>{query}</query>
<gold_answer>{gold_answer}</gold_answer>
<generated_answer>{generated_answer}</generated_answer>
"""

rules = """
Rules:
1. Follow the label definitions and judgement criteria in the prompt exactly.
2. For each judgment, evaluate ONLY the current nugget.
   Ignore all other information in the generated answer unless it directly
   contradicts this nugget.
3. Do not use external knowledge or invent information.
"""

refuse_rules = """
Rules:
1. Do not use external knowledge or invent information.

"""

def build_nugget_judge_prompt(query: str, nugget: str, generated_answer: str) -> str:
    prompt = start.format(query=query, nugget=nugget, generated_answer=generated_answer)
    return prompt

def build_refusal_judge_prompt(query: str, gold_answer: str, generated_answer: str) -> str:
    prompt = refuse_start.format(query=query, gold_answer=gold_answer, generated_answer=generated_answer)
    return prompt