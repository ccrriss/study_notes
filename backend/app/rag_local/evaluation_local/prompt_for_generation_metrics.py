prompt = """
You are judging a generated answer based on query and judging with nuggets.
There are 3 kinds of results you should determine:
1. Supported: The answer fully and accurately contains the fact presented in the
nugget.
2. Partially supported: The answer contains some of the information from the
nugget, but it might be incomplete or not fully accurate.
3. Not supported: The answer does not contain the information from the nugget
at all.
The output format should be like JSON format, including label and reason.

<query> {query}</query>
<nugget>{nugget}</nugget>
<generated_answer>{generated_answer}</generated_answer>


Rules:
1. Use only the information provided in the query and nugget.
Judging 
2. Do not use external knowledge or invent information.
3. If the answer is "partially supported", explain the reason but do not completing the answer and state the unsupported part instead.
"""