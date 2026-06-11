import json
from typing import Any

from .llm_service import chat_sync


def _format_readable(value: Any) -> str:
    """Format dict/list values as readable Chinese-preserving text."""
    return json.dumps(value, ensure_ascii=False, indent=2)


def generate_match_explanation(profile: dict, job: str, reasons: list) -> str:
    system_prompt = (
        "你是校园招聘AI定岗解释官。请根据提供的【关键原因列表】生成一段亲切、透明的原因解释，"
        "说明为何推荐该岗位。不要杜撰原因。结尾加上‘如需了解为何未推荐其他岗位，可点击下方【探索其他岗位】。’"
    )
    user_prompt = (
        "请根据以下信息生成岗位推荐原因解释：\n\n"
        f"【推荐岗位】\n{job}\n\n"
        f"【学生画像】\n{_format_readable(profile)}\n\n"
        f"【关键原因列表】\n{_format_readable(reasons)}"
    )
    messages = [
        {"role": "system", "content": system_prompt},
        {"role": "user", "content": user_prompt},
    ]
    return chat_sync(messages)


def generate_growth_advice(
    current_job: str,
    target_job: str,
    current_score: int,
    target_score: int,
    gaps: list,
) -> str:
    system_prompt = (
        "你是职业成长顾问。请根据差距列表生成积极、可操作的成长建议，每条建议对应一个差距，"
        "最后引导学生：‘若已具备以上补充材料，可发起岗位复审。’"
    )
    user_prompt = (
        "请根据以下信息生成成长建议：\n\n"
        f"【当前推荐岗位】\n{current_job}\n\n"
        f"【目标岗位】\n{target_job}\n\n"
        f"【当前匹配分】\n{current_score}\n\n"
        f"【目标岗位匹配分】\n{target_score}\n\n"
        f"【差距列表】\n{_format_readable(gaps)}"
    )
    messages = [
        {"role": "system", "content": system_prompt},
        {"role": "user", "content": user_prompt},
    ]
    return chat_sync(messages)


def generate_appeal_report(
    name: str,
    original_job: str,
    target_job: str,
    reason: str,
    orig_score: int,
    target_score: int,
) -> str:
    system_prompt = (
        "你是客观的HR助手，请将学生申诉整理成结构化报告，包含：学生姓名、原推荐岗位、"
        "申诉目标岗位、补充说明摘要、匹配度变化、以及‘建议人工复审’或‘维持原结果’的结语。"
        "语气中立，不评判学生选择。"
    )
    user_prompt = (
        "请根据以下申诉信息生成结构化报告：\n\n"
        f"【学生姓名】\n{name}\n\n"
        f"【原推荐岗位】\n{original_job}\n\n"
        f"【申诉目标岗位】\n{target_job}\n\n"
        f"【补充说明】\n{reason}\n\n"
        f"【原岗位匹配分】\n{orig_score}\n\n"
        f"【目标岗位匹配分】\n{target_score}"
    )
    messages = [
        {"role": "system", "content": system_prompt},
        {"role": "user", "content": user_prompt},
    ]
    return chat_sync(messages)
