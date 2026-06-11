from typing import Any

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from services.explain_service import (
    generate_appeal_report,
    generate_growth_advice,
    generate_match_explanation,
)


router = APIRouter(prefix="/demo", tags=["demo"])


class ExplainRequest(BaseModel):
    scenario_id: str


demo_scenarios: dict[str, dict[str, Any]] = {
    "demo_01": {
        "id": "demo_01",
        "name": "李明",
        "profile": {
            "algorithm_rank": "前15%",
            "internship": "云原生后端开发",
            "system_design_score": 85,
            "career_interest": "后端开发、分布式、容器化",
        },
        "recommended_job": "云计算研发工程师",
        "match_score": 87,
        "key_reasons": [
            "笔试算法题成绩超过同届85%学生",
            "实习经历包含云原生项目",
            "面试中表现出较强系统设计能力",
        ],
        "alternative_job": "AI算法工程师",
        "alt_match_score": 72,
        "alt_gaps": [
            "缺少机器学习项目经历",
            "算法竞赛经历较少",
            "深度学习相关课程较少",
        ],
        "appeal_reason": "我自学了PyTorch并复现了ResNet，未来希望从事AI方向",
    },
    "demo_02": {
        "id": "demo_02",
        "name": "王婷",
        "profile": {
            "algorithm_rank": "前40%",
            "internship": "前端开发",
            "system_design_score": 70,
            "career_interest": "数据科学、数据分析",
        },
        "recommended_job": "前端开发工程师",
        "match_score": 82,
        "key_reasons": [
            "实习经历与前端岗位高度相关",
            "笔试中 HTML/CSS/JS 模块得分前20%",
            "职业问卷中出现'可视化'、'交互'关键词",
        ],
        "alternative_job": "数据科学工程师",
        "alt_match_score": 55,
        "alt_gaps": [
            "没有 Python 数据分析项目",
            "数学建模或统计类竞赛经历空白",
            "SQL 能力未在笔试中体现",
        ],
        "appeal_reason": "我在课外完成了数据分析师训练营，并拿到证书，希望重新定岗",
    },
    "demo_03": {
        "id": "demo_03",
        "name": "张伟",
        "profile": {
            "algorithm_rank": "后30%",
            "internship": "硬件测试",
            "system_design_score": 60,
            "career_interest": "产品经理",
        },
        "recommended_job": "硬件测试工程师",
        "match_score": 78,
        "key_reasons": [
            "实习岗位与硬件测试直接匹配",
            "笔试中电路、信号相关题目得分较高",
            "职业问卷中提及'硬件'、'测试'频次高",
        ],
        "alternative_job": "产品经理",
        "alt_match_score": 40,
        "alt_gaps": [
            "没有产品相关实习或项目",
            "笔试中无产品题考察",
            "职业问卷未体现产品思维关键词",
        ],
        "appeal_reason": "我自学了产品经理全套课程，并主导过校内APP开发项目，附上作品集链接",
    },
}


@router.get("/scenarios")
def list_demo_scenarios() -> list[dict[str, str]]:
    return [
        {
            "id": scenario["id"],
            "name": scenario["name"],
            "recommended_job": scenario["recommended_job"],
        }
        for scenario in demo_scenarios.values()
    ]


@router.post("/explain")
def explain_demo_scenario(request: ExplainRequest) -> dict[str, Any]:
    scenario = demo_scenarios.get(request.scenario_id)
    if scenario is None:
        raise HTTPException(status_code=404, detail="Demo scenario not found")

    explanation = generate_match_explanation(
        profile=scenario["profile"],
        job=scenario["recommended_job"],
        reasons=scenario["key_reasons"],
    )
    advice = generate_growth_advice(
        current_job=scenario["recommended_job"],
        target_job=scenario["alternative_job"],
        current_score=scenario["match_score"],
        target_score=scenario["alt_match_score"],
        gaps=scenario["alt_gaps"],
    )
    appeal_report = generate_appeal_report(
        name=scenario["name"],
        original_job=scenario["recommended_job"],
        target_job=scenario["alternative_job"],
        reason=scenario["appeal_reason"],
        orig_score=scenario["match_score"],
        target_score=scenario["alt_match_score"],
    )

    return {
        "scenario": scenario,
        "explanation": explanation,
        "advice": advice,
        "appeal_report": appeal_report,
    }
