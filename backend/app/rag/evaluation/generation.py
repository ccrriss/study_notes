from app.rag.evaluation.prompts import generation_v2 as judge_prompt
from app.rag.evaluation.judge import judge
from app.schemas.evaluation import GenerationEvaluationQuestion, AnswerQuestion, JudgeResult, GenerationJudgement, GenerationEvaluationResponse
import json

async def judge_nugget(query:str, nugget: str, generated_answer: str):
    prompt = judge_prompt.build_nugget_judge_prompt(query=query, nugget=nugget, generated_answer=generated_answer)
    res_json = await judge(prompt=prompt, rules=judge_prompt.rules)
    res_dict = json.loads(res_json)
    return JudgeResult(label=res_dict['label'], reason=res_dict['reason'])

async def evaluate_generation(payload: GenerationEvaluationQuestion, generated_answer: str) -> GenerationEvaluationResponse:
    query = payload.query
    judgement_list = []

    if isinstance(payload, AnswerQuestion):
        vital_nuggets = payload.vital_nuggets
        ok_nuggets = payload.ok_nuggets or []

        for vital_nugget in vital_nuggets:
            judge_result = await judge_nugget(query=query, nugget=vital_nugget, generated_answer=generated_answer)

            judgement_list.append(GenerationJudgement(judgement_type="vital", nugget=vital_nugget, 
                                                      label=judge_result.label, reason=judge_result.reason))

        for ok_nugget in ok_nuggets:
            judge_result = await judge_nugget(query=query, nugget=ok_nugget, generated_answer=generated_answer)

            judgement_list.append(GenerationJudgement(judgement_type="ok", nugget=ok_nugget, 
                                                      label=judge_result.label, reason=judge_result.reason))
    else:
        gold_answer = payload.gold_answer
        prompt = judge_prompt.build_refusal_judge_prompt(query=query, gold_answer=gold_answer, generated_answer=generated_answer)
        res_json = await judge(prompt=prompt, rules=judge_prompt.refuse_rules)
        res_dict = json.loads(res_json)
        label = res_dict["label"]
        reason = res_dict["reason"]
        judgement_list.append(GenerationJudgement(judgement_type="refusal", label=label, reason=reason))

    return GenerationEvaluationResponse(
        id=payload.id,
        expected_behavior=payload.expected_behavior,
        generated_answer=generated_answer,
        judgements=judgement_list
    )

