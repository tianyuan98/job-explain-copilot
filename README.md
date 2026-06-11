# AI定岗解释官Demo

> 全栈 Web 应用 | 模板：全栈Web应用

## 项目介绍

**AI定岗解释官** 是一款面向 HR 校招场景的智能定岗辅助工具 Demo，基于 LLM 大模型能力，为候选人提供：

- **定岗匹配解释** — 根据候选人的笔试算法排名、实习经历、系统设计得分和职业兴趣，解释系统为何推荐某个岗位
- **换岗成长建议** — 当候选人偏好其他岗位时，分析当前能力差距并给出非线性成长路径
- **申诉报告生成** — 当候选人对定岗结果有异议时，自动生成结构化的申诉陈述报告

本项目包含 3 组演示场景数据，覆盖「云研发」「前端→数据科学」「硬件测试→产品经理」等典型定岗路径。

## 技术栈

| 层级 | 技术 |
|------|------|
| 后端框架 | Python (FastAPI) |
| 前端框架 | React |
| AI 能力 | LLM 大模型服务（智谱 GLM / 兼容 OpenAI 接口） |
| 运行时 | Node.js + Python 3.10+ |

## 项目结构

```
job-explain-copilot/
├── backend/
│   ├── main.py                 # 应用入口
│   ├── requirements.txt        # Python 依赖
│   ├── services/
│   │   ├── llm_service.py      # LLM 服务层
│   │   └── explain_service.py  # 解释业务逻辑（匹配解释、成长建议、申诉报告）
│   └── api/
│       └── demo.py             # Demo API 路由（3组内嵌场景数据）
├── frontend/
│   ├── src/
│   │   ├── App.js              # React 应用入口
│   │   ├── pages/
│   │   │   └── DemoPage.js     # 演示页面
│   │   └── components/
│   │       ├── ExplainCard.js  # 解释卡片组件
│   │       └── ScenarioSelector.js  # 场景选择器组件
│   ├── package.json            # 前端依赖
│   └── public/index.html       # HTML 模板
├── docs/
│   ├── index.html              # GitHub Pages 展示页
│   ├── demo-data.md            # 演示数据（与 backend/api/demo.py 同步）
│   ├── deploy-checklist.md     # 部署检查清单
│   └── deploy-guide.md         # GitHub + Vercel + Railway 部署方案
├── vercel.json                 # Vercel 单仓库部署配置
├── .env.example                # 环境变量模板
└── README.md                   # 项目说明
```

## 启动说明

完整的启动步骤及检查项请参见 [`docs/deploy-checklist.md`](./docs/deploy-checklist.md)，以下是核心流程：

### 1. 环境变量配置

```bash
cd backend
# 创建 .env 文件，填写智谱 API 密钥
cp ../.env.example .env
# 编辑 .env，填入 LLM_API_KEY=你的智谱API密钥
```

### 2. 启动后端（端口 8000）

```bash
cd backend
pip install -r requirements.txt
python main.py
```

### 3. 启动前端（端口 3000）

```bash
cd frontend
npm install
npm start
```

### 4. 验证

打开浏览器访问 `http://localhost:3000`，选择演示场景即可测试全部功能。

## 演示场景

| 场景 ID | 候选人 | 推荐岗位 | 匹配分 | 偏好岗位 | 偏好匹配分 |
|---------|--------|----------|--------|----------|------------|
| demo_01 | 李明 | 云计算研发工程师 | 87 | AI算法工程师 | 72 |
| demo_02 | 王婷 | 前端开发工程师 | 82 | 数据科学工程师 | 55 |
| demo_03 | 张伟 | 硬件测试工程师 | 78 | 产品经理 | 40 |

> 详细的场景数据 JSON 请查看 [`docs/demo-data.md`](./docs/demo-data.md)

## 远程部署

完整的远程部署方案请参见 [`docs/deploy-guide.md`](./docs/deploy-guide.md)（GitHub + Railway + Vercel）。

### 一键部署

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/tianyuan98/job-explain-copilot&root-directory=frontend&env=REACT_APP_API_URL&envDescription=后端%20API%20地址)

[![Deploy on Railway](https://railway.app/button.svg)](https://railway.app/new/template?template=https://github.com/tianyuan98/job-explain-copilot&envs=LLM_API_KEY,LLM_BASE_URL,LLM_MODEL)
