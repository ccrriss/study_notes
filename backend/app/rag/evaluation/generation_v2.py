from app.rag.evaluation.prompts.generation_v2 import rules, refuse_rules, build_refusal_judge_prompt, build_nugget_judge_prompt
from app.rag.evaluation.judge import judge
from app.schemas.evaluation import GenerationEvaluationQuestion, AnswerQuestion, RefusalQuestion, GenerationJudgement, GenerationEvaluationResponse
import json

async def evaluate_generation(payload: GenerationEvaluationQuestion, generated_answer: str) -> GenerationEvaluationResponse:
    query = payload.query
    judgement_list = []

    if isinstance(payload, AnswerQuestion):
        vital_nuggets = payload.vital_nuggets
        ok_nuggets = payload.ok_nuggets or []

        for vital_nugget in vital_nuggets:
            prompt = build_nugget_judge_prompt(query=query, nugget=vital_nugget, generated_answer=generated_answer)
            res_json = await judge(prompt=prompt, rules=rules)
            res_dict = json.loads(res_json)
            label = res_dict["label"]
            reason = res_dict["reason"]
            judgement_list.append(GenerationJudgement(judgement_type="vital", nugget=vital_nugget, label=label, reason=reason))

        for ok_nugget in ok_nuggets:
            prompt = build_nugget_judge_prompt(query=query, nugget=ok_nugget, generated_answer=generated_answer)
            res_json = await judge(prompt=prompt, rules=rules)
            res_dict = json.loads(res_json)
            label = res_dict["label"]
            reason = res_dict["reason"]
            judgement_list.append(GenerationJudgement(judgement_type="ok", nugget=ok_nugget, label=label, reason=reason))
    else:
        gold_answer = payload.gold_answer
        prompt = build_refusal_judge_prompt(query=query, gold_answer=gold_answer, generated_answer=generated_answer)
        res_json = await judge(prompt=prompt, rules=refuse_rules)
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

