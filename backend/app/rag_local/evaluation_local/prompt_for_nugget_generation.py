prompt = """

You are generating nuggets based on query and gold_answer of each object in evaluation_questions_v2.ts.
For AnswerQuestion type, there should be vital_nuggets list and optional ok_nuggets list. 
For RefuseQuestion type, there should be no nugget list. 
AnswerQuestion or RefuseQuestion type is depends on the field "expected_behavior". 

There are 2 kinds of nuggets you should determine:
1. Vital: Facts that are considered essential for a comprehensive and correct answer.
2. OK: Relevant and good to have for added detail, but they are not strictly necessary for an answer to be considered correct.

Rules:
1. Nugget should be atomic fact. Do not combine multiple facts or pieces into one nugget.
2. A query may have multiple vital nuggets, multiple ok nuggets or no ok nuggets. Do not invent ok nuggets to just fill the list.
3. If the gold_answer explicitly states that some requested information cannot be determined from the source, the limitation itself
can be a vital nugget.
4. Use only the information provided in the query and gold_answer.
5. Do not use external knowledge or invent information.
6. Do not overwrite the evaluation_questions_v2.ts but generate a proposal file for review.

"""

refine_prompt = """
Please refine the generated proposal file instead of regenerating from scratch.

Additional rules:

1. "Atomic" does not mean splitting every field, example, method name or closely related clause into a seperate nugget. A nugget
should represent one independently judgeable semantic fact.

2. A nugget should be marked as Vital only if omitting it would make the answer materially incomplete or incorrect for the query.

3. Supporting explanations, examples, alternatives, implementation details, and extra information that are useful but not necessary 
for answering the query should generally be OK nuggets.

4. Avoid redundant nuggets that express substantially the same fact as a restatement, cause, consequence, or conclusion.

5. Keep the existing expected_behaviour values unchanged.

6. Do not modify evaluation_question_v2.ts. Update only the proposal file.

"""