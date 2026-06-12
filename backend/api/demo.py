from typing import Any
from io import BytesIO
import json as _json

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
        "explanation": "亲爱的同学，您好！\n\n在仔细分析了您的个人资料和实习经历后，我们非常高兴地向您推荐云计算研发工程师这个岗位。以下是我们推荐这个岗位的几个关键原因：\n\n首先，您的笔试算法成绩位列前15%，这充分证明了您在逻辑思维和算法设计方面的强大能力。云计算领域对这类能力有着极高的需求，因此您在这个岗位上的表现将会非常出色。\n\n其次，您的实习经历与该岗位直接相关。在腾讯科技（深圳）有限公司的实习期间，您使用Go语言开发容器化微服务，并参与了Kubernetes集群的运维工作。这些宝贵的实践经验将帮助您更快地融入团队，并发挥您的专业技能。\n\n最后，在面试中，您的系统设计能力得到了85分的高评价，这表明您在架构设计和系统优化方面具备扎实的基础。这对于云计算研发工程师这一岗位至关重要。\n\n综上所述，我们相信您是云计算研发工程师这个岗位的理想人选。当然，我们也理解您可能对其他岗位也感兴趣，如果您想了解更多关于其他岗位的信息，可以点击下方的【探索其他岗位】。\n\n期待您的加入，一起在云计算领域开启新的篇章！\n\n如需了解为何未推荐其他岗位，可点击下方【探索其他岗位】。",
        "advice": "成长建议：\n\n1. **加强机器学习项目经历积累**：\n   - **建议**：积极参与或主导与机器学习相关的项目，例如参与开源项目、内部技术挑战赛或自己发起小型的机器学习项目。通过实际操作，提升在数据预处理、特征工程、模型选择和调优等方面的能力。\n   - **行动**：报名参加在线课程或工作坊，学习机器学习框架（如TensorFlow或PyTorch）的应用，并在项目中实践。\n\n2. **提升算法竞赛参与度**：\n   - **建议**：报名参加算法竞赛，如Kaggle竞赛，通过解决实际问题来提升算法设计能力和问题解决技巧。竞赛经验有助于在简历中突出你的技术实力。\n   - **行动**：关注算法竞赛的信息，如每周的编程挑战，定期参加并记录你的成绩和经验。\n\n3. **体现深度学习课程成绩**：\n   - **建议**：确保你的简历中清晰地体现了深度学习相关课程的成绩，特别是那些与AI算法工程师岗位紧密相关的课程。如果成绩优异，可以详细列出课程名称、成绩以及你在课程中的具体贡献。\n   - **行动**：更新简历，将深度学习相关课程的成绩以突出方式呈现，并简要描述你在课程项目中的角色和取得的成果。\n\n引导：\n\n若您已经根据以上建议采取了行动，并成功补充了机器学习项目经历、算法竞赛获奖记录以及深度学习相关课程成绩，这些材料将有助于提升您在AI算法工程师岗位上的匹配度。请确保所有信息都是最新和最准确的。一旦完成这些补充，您可以发起岗位复审，以期待获得新的机会。祝您成长顺利，期待您的复审申请！",
        "appeal_report": "【学生申诉结构化报告】\n\n一、学生基本信息\n- 学生姓名：李明\n\n二、原推荐岗位信息\n- 原推荐岗位：云计算研发工程师\n\n三、申诉目标岗位信息\n- 申诉目标岗位：AI 算法工程师\n\n四、补充说明摘要\n- 李明同学表示，通过自学掌握了 PyTorch 并成功复现了 ResNet 模型，对 AI 领域有浓厚兴趣，希望转向 AI 算法工程师岗位。\n\n五、岗位匹配度变化\n- 原岗位匹配分：87\n- 目标岗位匹配分：72\n\n六、建议\n- 由于李明同学在 AI 领域展现出一定的自学能力和项目经验，但原推荐岗位与申诉目标岗位的匹配分存在一定差距，建议进行以下处理：\n  - 建议人工复审：对李明同学的技术能力和学习热情进行更深入的评估，以确定其在 AI 算法工程师岗位上的适应性和潜力。\n  - 维持原结果：如果经过复审，认为李明同学在云计算研发工程师岗位上具备更高的匹配度和职业发展潜力，则维持原推荐岗位。\n\n七、结语\n- 根据以上分析，建议进行人工复审以确定最终岗位分配。",
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
        "explanation": "亲爱的同学，\n\n首先，非常感谢你对我们公司的关注和兴趣。经过综合考虑你的个人能力和过往经历，我们非常推荐你担任前端开发工程师这一岗位。\n\n首先，你的实习经历与前端岗位高度匹配。在字节跳动担任前端开发实习生的经历，让你在React和TypeScript等技术上积累了宝贵的实践经验，这对于前端开发工程师这一岗位来说至关重要。\n\n其次，你在笔试中HTML/CSS/JS模块的得分位居前20%，这充分证明了你在前端技术方面的扎实基础和优秀能力。\n\n再者，在职业问卷中，你多次提到\"可视化\"和\"交互\"这两个关键词，这表明你对前端开发中的用户体验和视觉效果有着浓厚的兴趣，这也是我们前端开发工程师岗位所看重的特质。\n\n当然，我们也理解你对数据科学和数据分析领域的兴趣，前端开发工程师这一岗位同样可以为你在数据可视化方面提供广阔的发展空间。\n\n最后，如需了解为何未推荐其他岗位，可点击下方【探索其他岗位】。\n\n期待你的加入，共同开启美好的职业旅程！\n\n祝好，\n[公司名称]校园招聘团队",
        "advice": "成长建议：\n\n1. **积累 Python 数据分析项目经验**：\n   - **建议**：利用业余时间参与或自行发起一些数据分析相关的项目。可以从小型数据集开始，逐步提升至更复杂的数据集。参与开源项目也是不错的选择，这不仅能提高你的编程能力，还能让你在项目中实际应用Python数据分析。\n   - **具体行动**：加入数据分析的在线课程，完成项目报告；在GitHub上寻找并参与相关项目；利用工具如Pandas、NumPy、Matplotlib等进行数据分析实践。\n\n2. **参加数学建模或统计类竞赛**：\n   - **建议**：报名参加数学建模或统计类竞赛，这些竞赛通常需要综合运用数学、统计学和编程知识解决问题，能够有效提升你的数据分析和解决问题的能力。\n   - **具体行动**：关注相关竞赛信息，如全国大学生数学建模竞赛、统计建模与应用大赛等；组建团队，练习历届竞赛题目；在竞赛过程中不断学习和改进。\n\n3. **提升 SQL 能力**：\n   - **建议**：通过实际操作和在线课程来提高你的SQL技能。可以通过模拟数据库环境进行练习，或者在实际工作中寻找机会应用SQL。\n   - **具体行动**：安装SQL数据库如MySQL或PostgreSQL，进行实际操作；参加SQL在线课程，如\"SQL从入门到精通\"；在工作中主动承担数据库查询任务，增强实战经验。\n\n引导：\n若您已经根据以上建议采取了行动，并在相关领域取得了显著的进步，请整理相关项目经验、竞赛成果和SQL能力的证明材料。准备好这些补充材料后，您可以发起岗位复审，以证明您已经缩小了与目标岗位的差距，并具备成为一名数据科学工程师的潜力。祝您成长顺利！",
        "appeal_report": "【结构化报告】\n\n---\n\n**学生姓名：** 王婷\n\n**原推荐岗位：** 前端开发工程师\n\n**申诉目标岗位：** 数据科学工程师\n\n**补充说明摘要：**\n王婷同学提出申诉，希望调整其推荐岗位。她在课外参加了数据分析师训练营并获得了证书，以此证明自己对数据科学领域的兴趣和技能提升，希望学校能考虑其情况，重新评估并推荐数据科学工程师岗位。\n\n**匹配度变化：**\n- 原岗位匹配分：82\n- 目标岗位匹配分：55\n\n**结语：**\n鉴于王婷同学提供的课外学习和证书证明，以及原岗位与目标岗位的匹配分差异，建议进行人工复审，以更全面地评估她的技能和兴趣与目标岗位的匹配度。复审结果将有助于确定是否调整推荐岗位，以更好地满足学生的职业发展需求。建议：建议人工复审。\n\n---",
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
        "explanation": "亲爱的同学，您好！\n\n首先，非常感谢您对我们公司的关注和选择。经过综合评估，我们非常高兴地向您推荐硬件测试工程师这个岗位。以下是我们推荐这个岗位的几个关键原因：\n\n1. **实习经历与岗位对口**：您在华为技术有限公司的实习经历，正是硬件测试工程师岗位的直接对口经验。您在实习期间负责5G基站射频模块的自动化测试脚本编写和测试报告输出，这些经历充分证明了您在硬件测试领域的专业能力和实践技能。\n\n2. **笔试表现优异**：在笔试环节，您在电路和信号相关题目上的得分较高，这充分展示了您在硬件知识方面的扎实基础和良好的学习理解能力。\n\n3. **职业兴趣匹配**：在您的职业问卷中，我们发现\"硬件\"和\"测试\"这两个关键词出现的频次较高，这表明您对硬件测试领域有着浓厚的兴趣和热情。\n\n当然，我们也注意到您对产品经理这一岗位也表现出一定的兴趣，但考虑到您的实习经历、笔试表现和职业兴趣，硬件测试工程师这个岗位将为您提供一个更好的发展平台，帮助您在技术领域深耕细作。\n\n如果您对其他岗位也感兴趣，或者想了解更多关于这个岗位的信息，请点击下方的【探索其他岗位】进行了解。\n\n期待您的加入，共同开启精彩的职业旅程！\n\n祝好，\n[公司名称]校园招聘团队",
        "advice": "成长建议：\n\n1. **积累产品相关实习或项目经历**\n   - **建议**：主动寻找与产品相关的实习或项目机会，可以是校园项目、校内竞赛或者是与产品经理合作的机会。通过实际操作，理解产品开发的流程和产品经理的角色，积累实践经验。\n   - **行动步骤**：\n     - 查找校园内外的产品开发工作坊。\n     - 参与校内的创新创业项目。\n     - 与正在从事产品经理的朋友合作，参与项目。\n\n2. **提升笔试中的产品思维能力**\n   - **建议**：定期练习产品思维相关的题目，如用户需求分析、产品设计、产品策略等。可以通过在线课程、阅读相关书籍或者参加相关的培训来提升这方面的能力。\n   - **行动步骤**：\n     - 加入产品经理相关的线上社区，如PMCAFFE、人人都是产品经理等。\n     - 参加产品思维相关的网络课程，如网易云课堂、慕课网上的产品经理课程。\n     - 定期进行模拟笔试，尤其是针对产品思维题目的训练。\n\n3. **强化职业问卷中的产品经理核心能力体现**\n   - **建议**：在职业问卷中，通过具体的例子来展示你的产品经理核心能力，如市场洞察力、用户同理心、项目管理能力等。\n   - **行动步骤**：\n     - 在个人简历和工作描述中，使用STAR法则（Situation, Task, Action, Result）来描述你的经历。\n     - 列举具体案例，如\"在XX项目中，我如何通过XX策略解决了XX问题\"。\n     - 与产品经理职位描述中的核心能力相匹配，确保你的回答能够体现出这些能力。\n\n引导学生：\n若您已经按照上述建议采取了行动，积累了相关经验，并在职业问卷中体现了产品经理的核心能力，那么您的职业发展路径已经向前迈出了一大步。此时，您可以发起岗位复审，让评审团重新评估您的匹配度。祝您在职业成长的道路上取得成功！",
        "appeal_report": "【结构化学生申诉报告】\n\n一、学生信息\n- 学生姓名：张伟\n\n二、原推荐岗位\n- 原推荐岗位：硬件测试工程师\n\n三、申诉目标岗位\n- 申诉目标岗位：产品经理\n\n四、补充说明摘要\n- 学生张伟自学了产品经理全套课程，并主导过校内 APP 开发项目。为支持其申诉，学生提供了作品集链接，表达了对产品经理岗位的强烈兴趣和相应能力。\n\n五、匹配度变化\n- 原岗位匹配分：78\n- 目标岗位匹配分：40\n\n六、建议\n- 由于学生张伟提供了自学经历和项目经验作为补充，且目标岗位匹配分相较于原推荐岗位有较大差距，建议进行人工复审，以更全面地评估学生的能力和适应性。\n\n七、结语\n- 建议人工复审。",
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

    return {
        "scenario": scenario,
        "archive": scenario["archive"],
        "portrait": scenario["portrait"],
        "explanation": scenario.get("explanation", ""),
        "advice": scenario.get("advice", ""),
        "appeal_report": scenario.get("appeal_report", ""),
    }


PARSE_SYSTEM_PROMPT = (
    "你是一个精确的简历解析助手。请从以下简历文本中提取信息，"
    "只返回一个JSON对象，不要包含任何其他文字、解释或标记。"
    "JSON必须包含以下字段：name(姓名), school(学校), major(专业), "
    "degree(学历), internship(实习经历), projects(项目经历), "
    "certificates(证书), career_interest(职业意向)。"
    "如果文本中找不到某个字段，该字段的值设为空字符串\"\"，不要写\"未识别\"。"
)

FALLBACK_RESULT: dict[str, str] = {
    "name": "",
    "school": "",
    "major": "",
    "degree": "",
    "internship": "",
    "projects": "",
    "certificates": "",
    "career_interest": "",
}


@router.post("/parse_resume")
async def parse_resume(file: UploadFile = File(...)) -> dict[str, Any]:
    if not file.filename or not file.filename.lower().endswith(".pdf"):
        raise HTTPException(status_code=400, detail="仅支持 PDF 文件")

    # 1. 提取 PDF 文本
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

    print(f"[parse_resume] 提取文本长度: {len(raw_text)} 字符", flush=True)

    if not raw_text:
        raise HTTPException(status_code=400, detail="未能从 PDF 中提取到文本，该文件可能为扫描件或图片")

    # 2. 调用智谱 API
    messages = [
        {"role": "system", "content": PARSE_SYSTEM_PROMPT},
        {"role": "user", "content": raw_text},
    ]

    try:
        llm_response = chat_sync(messages)
        print(f"[parse_resume] LLM 返回长度: {len(llm_response)} 字符", flush=True)
    except Exception as exc:
        print(f"[parse_resume] LLM 调用失败: {exc}", flush=True)
        return dict(FALLBACK_RESULT)

    # 3. 解析 JSON
    cleaned = llm_response.strip()
    if cleaned.startswith("```"):
        lines = cleaned.split("\n")
        lines = [l for l in lines if not l.strip().startswith("```")]
        cleaned = "\n".join(lines).strip()

    try:
        result = _json.loads(cleaned)
        print(f"[parse_resume] JSON 解析成功, 字段: {list(result.keys())}", flush=True)
    except _json.JSONDecodeError:
        print(f"[parse_resume] JSON 解析失败, 原始返回: {llm_response[:200]}", flush=True)
        return dict(FALLBACK_RESULT)

    # 4. 标准化字段：缺失补空字符串，去掉"未识别"
    normalized: dict[str, str] = {}
    for key in FALLBACK_RESULT:
        value = str(result.get(key, "")).strip()
        if value in ("未识别", "未知", "无"):
            value = ""
        normalized[key] = value

    return normalized
