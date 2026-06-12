from typing import Any
from io import BytesIO

from fastapi import APIRouter, File, HTTPException, UploadFile
from pydantic import BaseModel
from PyPDF2 import PdfReader

from services.explain_service import (
    generate_appeal_report,
    generate_growth_advice,
    generate_match_explanation,
)
from services.llm_service import chat_sync


router = APIRouter(prefix="/demo", tags=["demo"])


class ExplainRequest(BaseModel):
    scenario_id: str


demo_scenarios: dict[str, dict[str, Any]] = {
    "demo_01": {
        "id": "demo_01",
        "name": "李明",
        "profile": {
            "algorithm_rank": "前15%",
            "internship": "2025.06 - 2025.09 在腾讯科技（深圳）有限公司担任云原生后端开发实习生，使用 Go 开发容器化微服务并参与 Kubernetes 集群运维",
            "system_design_score": 85,
            "career_interest": "后端开发、云原生、分布式系统",
        },
        "recommended_job": "云计算研发工程师",
        "match_score": 87,
        "key_reasons": [
            "笔试算法成绩位列前15%，逻辑能力强",
            "实习经历直接覆盖云原生与微服务开发",
            "面试中系统设计能力表现突出（85分）",
        ],
        "alternative_job": "AI 算法工程师",
        "alt_match_score": 72,
        "alt_gaps": [
            "缺少机器学习相关项目经历",
            "简历中无算法竞赛获奖记录",
            "深度学习相关课程成绩未体现",
        ],
        "appeal_reason": "我自学了 PyTorch 并复现了 ResNet，未来希望从事 AI 方向",
        "archive": [
            {
                "label": "学校",
                "value": "北京邮电大学",
                "source": "来自简历",
                "editable": True,
            },
            {
                "label": "专业",
                "value": "计算机科学与技术",
                "source": "来自简历",
                "editable": True,
            },
            {
                "label": "学历",
                "value": "本科",
                "source": "来自简历",
                "editable": True,
            },
            {
                "label": "算法笔试排名",
                "value": "前15%",
                "source": "来自笔试",
                "editable": True,
            },
            {
                "label": "实习经历",
                "value": (
                    "腾讯科技（深圳）有限公司，云原生后端开发实习生，2025.06 - 2025.09。"
                    "使用 Go 语言开发容器化微服务，参与 Kubernetes 集群运维，"
                    "编写自动化部署脚本，优化 CI/CD 流水线。"
                ),
                "source": "来自简历",
                "editable": True,
            },
            {
                "label": "项目经历",
                "value": (
                    "\u201c分布式缓存系统\u201d课程设计（2024.09 - 2024.12），技术栈：Go + Redis + gRPC，"
                    "负责核心缓存淘汰策略实现，通过 Redis 集群实现数据分片与高可用。\n"
                    "\u201c轻量级 API 网关\u201d个人项目（2025.01 - 2025.04），技术栈：Go + Gin + JWT + Docker，"
                    "独立完成路由转发、限流、鉴权模块，部署在阿里云 ECS，已通过毕业设计答辩。"
                ),
                "source": "来自简历",
                "editable": True,
            },
            {
                "label": "证书/补充",
                "value": "AWS Solutions Architect Associate 认证（2024.08）",
                "source": "手动补充",
                "editable": True,
            },
            {
                "label": "职业意向",
                "value": "后端开发、云原生、分布式系统",
                "source": "来自志愿",
                "editable": True,
            },
        ],
        "portrait": (
            "算法思维：较强（笔试算法成绩位列前15%，说明逻辑推理和问题拆解能力较突出）\n"
            "系统设计：较强（面试系统设计评分85分，且项目中涉及缓存分片、高可用和网关限流设计）\n"
            "工程实践：较强（腾讯云原生后端实习覆盖 Go 微服务、Kubernetes 运维和 CI/CD 优化）\n"
            "项目完整度：较强（分布式缓存系统与轻量级 API 网关均有明确技术栈、职责和落地结果）\n"
            "你的职业意向：后端开发、云原生、分布式系统（来自志愿，与实习和项目方向一致）\n\n"
            "说明：以上是基于你提供资料的初步分析，后续岗位推荐将以此为基础。"
        ),
    },
    "demo_02": {
        "id": "demo_02",
        "name": "王婷",
        "profile": {
            "algorithm_rank": "前40%",
            "internship": "2025.03 - 2025.06 在字节跳动担任前端开发实习生，参与抖音电商后台管理系统，使用 React + TypeScript 搭建商品管理模块 UI 组件库",
            "system_design_score": 70,
            "career_interest": "数据科学、数据分析（但对前端也有兴趣）",
        },
        "recommended_job": "前端开发工程师",
        "match_score": 82,
        "key_reasons": [
            "实习经历与前端岗位高度匹配",
            "笔试中 HTML/CSS/JS 模块得分前20%",
            "职业问卷中多次出现\u201c可视化\u201d、\u201c交互\u201d关键词",
        ],
        "alternative_job": "数据科学工程师",
        "alt_match_score": 55,
        "alt_gaps": [
            "缺乏 Python 数据分析项目经验",
            "未参加数学建模或统计类竞赛",
            "笔试中 SQL 能力未体现",
        ],
        "appeal_reason": "我在课外完成了数据分析师训练营，并拿到证书，希望重新定岗",
        "archive": [
            {
                "label": "学校",
                "value": "华中科技大学",
                "source": "来自简历",
                "editable": True,
            },
            {
                "label": "专业",
                "value": "软件工程",
                "source": "来自简历",
                "editable": True,
            },
            {
                "label": "学历",
                "value": "硕士",
                "source": "来自简历",
                "editable": True,
            },
            {
                "label": "算法笔试排名",
                "value": "前40%",
                "source": "来自笔试",
                "editable": True,
            },
            {
                "label": "实习经历",
                "value": (
                    "字节跳动，前端开发实习生，2025.03 - 2025.06。"
                    "参与抖音电商后台管理系统的前端开发，使用 React + TypeScript，"
                    "负责商品管理模块的 UI 组件库搭建。"
                ),
                "source": "来自简历",
                "editable": True,
            },
            {
                "label": "项目经历",
                "value": (
                    "\u201c数据可视化大屏\u201d课程项目（2024.10 - 2025.01），技术栈：Vue3 + ECharts + WebSocket，"
                    "实现实时数据流展示，设计可复用图表组件，获得校级优秀项目。\n"
                    "\u201c个人博客系统\u201d开源项目（持续维护），技术栈：Next.js + TailwindCSS + MDX，"
                    "全栈独立开发，支持暗黑模式与全文检索，GitHub Stars 120+。"
                ),
                "source": "来自简历",
                "editable": True,
            },
            {
                "label": "证书/补充",
                "value": "课外完成数据分析师训练营并取得证书",
                "source": "手动补充",
                "editable": True,
            },
            {
                "label": "职业意向",
                "value": "数据科学、数据分析（但对前端也有兴趣）",
                "source": "来自志愿",
                "editable": True,
            },
        ],
        "portrait": (
            "算法思维：中等（算法笔试排名前40%，基础能力达标但不属于突出优势）\n"
            "前端工程：较强（字节跳动前端实习覆盖 React + TypeScript 和后台系统组件库建设）\n"
            "交互与可视化：较强（数据可视化大屏项目使用 Vue3 + ECharts + WebSocket，并获得校级优秀项目）\n"
            "数据分析能力：待补充（职业意向偏数据科学，但简历中缺少 Python 数据分析、SQL 或统计建模经历）\n"
            "你的职业意向：数据科学、数据分析，同时对前端也有兴趣（来自志愿）\n\n"
            "说明：以上是基于你提供资料的初步分析，后续岗位推荐将以此为基础。"
        ),
    },
    "demo_03": {
        "id": "demo_03",
        "name": "张伟",
        "profile": {
            "algorithm_rank": "后30%",
            "internship": "2025.07 - 至今 在华为技术有限公司担任硬件测试实习生，负责 5G 基站射频模块自动化测试脚本编写并输出测试报告",
            "system_design_score": 60,
            "career_interest": "产品经理（对硬件兴趣不大）",
        },
        "recommended_job": "硬件测试工程师",
        "match_score": 78,
        "key_reasons": [
            "实习岗位与硬件测试直接对口",
            "笔试中电路、信号相关题目得分较高",
            "职业问卷中出现\"硬件\"、\"测试\"频次高",
        ],
        "alternative_job": "产品经理",
        "alt_match_score": 40,
        "alt_gaps": [
            "无产品相关实习或项目经历",
            "笔试中无产品思维题考察",
            "职业问卷未体现产品经理核心能力",
        ],
        "appeal_reason": "我自学了产品经理全套课程，并主导过校内 APP 开发项目，附上作品集链接，希望进入产品岗位",
        "archive": [
            {
                "label": "学校",
                "value": "西安电子科技大学",
                "source": "来自简历",
                "editable": True,
            },
            {
                "label": "专业",
                "value": "电子信息工程",
                "source": "来自简历",
                "editable": True,
            },
            {
                "label": "学历",
                "value": "本科",
                "source": "来自简历",
                "editable": True,
            },
            {
                "label": "算法笔试排名",
                "value": "后30%",
                "source": "来自笔试",
                "editable": True,
            },
            {
                "label": "实习经历",
                "value": (
                    "华为技术有限公司，硬件测试实习生，2025.07 - 至今。"
                    "负责 5G 基站射频模块的自动化测试脚本编写，使用 Python 与内部测试框架，"
                    "输出测试报告。"
                ),
                "source": "来自简历",
                "editable": True,
            },
            {
                "label": "项目经历",
                "value": (
                    "\u201c基于 Arduino 的智能家居控制系统\u201d课设（2024.03 - 2024.06），技术栈：Arduino + C++ + MQTT，"
                    "负责硬件选型与嵌入式开发，实现温湿度传感器数据上报与远程控制。\n"
                    "\u201c校园二手交易平台\u201d小程序（2024.09 - 2024.12），技术栈：微信小程序 + 云开发，"
                    "负责前端页面与数据库设计，用户量达到校内 500+。"
                ),
                "source": "来自简历",
                "editable": True,
            },
            {
                "label": "证书/补充",
                "value": "自学产品经理课程，主导过校内 APP 开发项目并准备作品集链接",
                "source": "手动补充",
                "editable": True,
            },
            {
                "label": "职业意向",
                "value": "产品经理（对硬件兴趣不大）",
                "source": "来自志愿",
                "editable": True,
            },
        ],
        "portrait": (
            "算法思维：待提升（算法笔试排名后30%，通用编程与算法能力不是当前优势）\n"
            "硬件基础：较强（电子信息工程背景，笔试中电路、信号相关题目得分较高）\n"
            "测试实践：较强（华为 5G 基站射频模块测试实习，涉及 Python 自动化脚本和测试报告输出）\n"
            "产品能力：待补充（职业意向为产品经理，但简历中产品调研、需求分析和商业化指标经验不足）\n"
            "你的职业意向：产品经理，对硬件兴趣不大（来自志愿）\n\n"
            "说明：以上是基于你提供资料的初步分析，后续岗位推荐将以此为基础。"
        ),
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
        "archive": scenario["archive"],
        "portrait": scenario["portrait"],
        "explanation": explanation,
        "advice": advice,
        "appeal_report": appeal_report,
    }


PARSE_SYSTEM_PROMPT = (
    "你是一个简历解析助手。请从以下简历文本中提取指定字段，只返回JSON格式，不要其他文字。"
    "如果某个字段在文本中找不到，请填写'未识别'。"
    "JSON 字段：name（姓名）、school（学校）、major（专业）、degree（学历）、"
    "internship（实习经历描述）、projects（项目经历描述）、"
    "certificates（证书/补充）、career_interest（职业意向）。"
)


@router.post("/parse_resume")
async def parse_resume(file: UploadFile = File(...)) -> dict[str, Any]:
    if not file.filename or not file.filename.lower().endswith(".pdf"):
        raise HTTPException(status_code=400, detail="仅支持 PDF 文件")

    try:
        contents = await file.read()
        reader = PdfReader(BytesIO(contents))
        text_parts: list[str] = []
        for page in reader.pages:
            page_text = page.extract_text()
            if page_text:
                text_parts.append(page_text)
        raw_text = "\n".join(text_parts).strip()
    except Exception:
        raise HTTPException(status_code=400, detail="PDF 文件无法读取，请检查文件是否完整")

    if not raw_text:
        raise HTTPException(status_code=400, detail="未能从 PDF 中提取到文本，该文件可能为扫描件或图片")

    messages = [
        {"role": "system", "content": PARSE_SYSTEM_PROMPT},
        {"role": "user", "content": f"请解析以下简历文本：\n\n{raw_text}"},
    ]

    try:
        llm_response = chat_sync(messages)
    except Exception:
        # Demo 模式或无 API 密钥时返回未识别
        return {
            "name": "未识别",
            "school": "未识别",
            "major": "未识别",
            "degree": "未识别",
            "internship": "未识别",
            "projects": "未识别",
            "certificates": "未识别",
            "career_interest": "未识别",
        }

    import json as _json
    try:
        # 清洗 LLM 可能包裹的 markdown 代码块
        cleaned = llm_response.strip()
        if cleaned.startswith("```"):
            lines = cleaned.split("\n")
            lines = [l for l in lines if not l.startswith("```")]
            cleaned = "\n".join(lines).strip()
        result = _json.loads(cleaned)
    except _json.JSONDecodeError:
        return {
            "name": "未识别",
            "school": "未识别",
            "major": "未识别",
            "degree": "未识别",
            "internship": "未识别",
            "projects": "未识别",
            "certificates": "未识别",
            "career_interest": "未识别",
        }

    return result
