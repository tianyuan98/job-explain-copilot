# 演示数据

> 此页面用于存放 Demo 演示所需的样例数据。请在下方依次贴入 3 组 JSON 数据。

---

## 第 1 组数据 — 李明 · 云计算研发工程师

<!-- 与 backend/api/demo.py 中 demo_01 保持一致，V1 新增 archive 和 portrait -->

```json
{
  "id": "demo_01",
  "name": "李明",
  "profile": {
    "algorithm_rank": "前15%",
    "internship": "云原生后端开发",
    "system_design_score": 85,
    "career_interest": "后端开发、分布式、容器化"
  },
  "recommended_job": "云计算研发工程师",
  "match_score": 87,
  "key_reasons": [
    "笔试算法题成绩超过同届85%学生",
    "实习经历包含云原生项目",
    "面试中表现出较强系统设计能力"
  ],
  "alternative_job": "AI算法工程师",
  "alt_match_score": 72,
  "alt_gaps": [
    "缺少机器学习项目经历",
    "算法竞赛经历较少",
    "深度学习相关课程较少"
  ],
  "appeal_reason": "我自学了PyTorch并复现了ResNet，未来希望从事AI方向",
  "archive": [
    {"label": "算法笔试排名", "value": "前15%", "source": "来自笔试", "editable": true},
    {"label": "实习经历", "value": "云原生后端开发", "source": "来自简历", "editable": true},
    {"label": "系统设计表现", "value": "85分", "source": "来自面试", "editable": true},
    {"label": "职业意向", "value": "后端开发、分布式、容器化", "source": "来自志愿", "editable": true}
  ],
  "portrait": "算法思维：较强（笔试算法题成绩超过同届85%学生）\n系统设计：较强（面试中表现出较强系统设计能力，系统设计评分85）\n工程实践：较强（实习经历包含云原生后端开发项目）\n你的职业意向：后端开发、分布式、容器化（来自志愿）\n\n说明：以上是基于你提供资料的初步分析，后续岗位推荐将以此为基础。"
}
```

---

## 第 2 组数据 — 王婷 · 前端开发工程师

<!-- 与 backend/api/demo.py 中 demo_02 保持一致，V1 新增 archive 和 portrait -->

```json
{
  "id": "demo_02",
  "name": "王婷",
  "profile": {
    "algorithm_rank": "前40%",
    "internship": "前端开发",
    "system_design_score": 70,
    "career_interest": "数据科学、数据分析"
  },
  "recommended_job": "前端开发工程师",
  "match_score": 82,
  "key_reasons": [
    "实习经历与前端岗位高度相关",
    "笔试中 HTML/CSS/JS 模块得分前20%",
    "职业问卷中出现'可视化'、'交互'关键词"
  ],
  "alternative_job": "数据科学工程师",
  "alt_match_score": 55,
  "alt_gaps": [
    "没有 Python 数据分析项目",
    "数学建模或统计类竞赛经历空白",
    "SQL 能力未在笔试中体现"
  ],
  "appeal_reason": "我在课外完成了数据分析师训练营，并拿到证书，希望重新定岗",
  "archive": [
    {"label": "算法笔试排名", "value": "前40%", "source": "来自笔试", "editable": true},
    {"label": "实习经历", "value": "前端开发", "source": "来自简历", "editable": true},
    {"label": "前端能力表现", "value": "HTML/CSS/JS 模块前20%", "source": "来自笔试", "editable": true},
    {"label": "职业意向", "value": "数据科学、数据分析", "source": "来自志愿", "editable": true}
  ],
  "portrait": "算法思维：中等（算法笔试排名前40%）\n前端实践：较强（实习经历与前端岗位高度相关，前端模块得分前20%）\n数据能力：待补充（暂未检测到 Python 数据分析项目或 SQL 能力证明）\n你的职业意向：数据科学、数据分析（来自志愿）\n\n说明：以上是基于你提供资料的初步分析，后续岗位推荐将以此为基础。"
}
```

---

## 第 3 组数据 — 张伟 · 硬件测试工程师

<!-- 与 backend/api/demo.py 中 demo_03 保持一致，V1 新增 archive 和 portrait -->

```json
{
  "id": "demo_03",
  "name": "张伟",
  "profile": {
    "algorithm_rank": "后30%",
    "internship": "硬件测试",
    "system_design_score": 60,
    "career_interest": "产品经理"
  },
  "recommended_job": "硬件测试工程师",
  "match_score": 78,
  "key_reasons": [
    "实习岗位与硬件测试直接匹配",
    "笔试中电路、信号相关题目得分较高",
    "职业问卷中提及'硬件'、'测试'频次高"
  ],
  "alternative_job": "产品经理",
  "alt_match_score": 40,
  "alt_gaps": [
    "没有产品相关实习或项目",
    "笔试中无产品题考察",
    "职业问卷未体现产品思维关键词"
  ],
  "appeal_reason": "我自学了产品经理全套课程，并主导过校内APP开发项目，附上作品集链接",
  "archive": [
    {"label": "算法笔试排名", "value": "后30%", "source": "来自笔试", "editable": true},
    {"label": "实习经历", "value": "硬件测试", "source": "来自简历", "editable": true},
    {"label": "硬件相关能力", "value": "电路、信号相关题目得分较高", "source": "来自笔试", "editable": true},
    {"label": "职业意向", "value": "产品经理", "source": "来自志愿", "editable": true}
  ],
  "portrait": "算法思维：待提升（算法笔试排名后30%）\n硬件基础：较强（电路、信号相关题目得分较高）\n测试实践：较强（实习岗位与硬件测试直接匹配）\n产品能力：待补充（暂未检测到产品相关实习或项目）\n你的职业意向：产品经理（来自志愿）\n\n说明：以上是基于你提供资料的初步分析，后续岗位推荐将以此为基础。"
}
```
