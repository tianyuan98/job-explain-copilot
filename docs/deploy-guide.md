# GitHub + Vercel + Railway 部署方案

> 本方案将后端部署到 Railway（Python FastAPI），前端部署到 Vercel（React），通过 GitHub 自动触发部署。

## V1 功能说明

V1 版本新增了完整的三步可解释推荐流程：

| 步骤 | 功能 | 对应数据 |
|------|------|----------|
| **步骤1：档案确认** | 候选人确认个人档案信息（笔试排名、实习经历、系统设计表现、职业意向），支持编辑。数据来源标注（来自笔试/简历/面试/志愿）。 | `archive` 字段 |
| **步骤2：AI 画像** | 基于档案自动生成候选人能力画像摘要，涵盖算法思维、系统设计、工程实践、数据能力等维度。 | `portrait` 字段 |
| **步骤3：可解释推荐** | 展示岗位匹配解释、换岗成长建议、申诉报告生成——全链路可解释。 | `explanation` / `advice` / `appeal_report` |

> 以上数据均内嵌在 `backend/api/demo.py` 中，无需外部数据库。详情参见 [`docs/demo-data.md`](./demo-data.md)。

---

## 1. 初始化 Git 并推送至 GitHub

```bash
cd job-explain-copilot
git init
git add -A
git commit -m "初始化 AI定岗解释官Demo"
git remote add origin https://github.com/tianyuan98/job-explain-copilot.git
git branch -M main
git push -u origin main
```

> 若在国内网络环境下推送失败，可尝试 `git -c http.version=HTTP/1.1 push`。

---

## 2. 后端部署到 Railway

Railway 会自动识别 `backend/` 目录下的 Python 项目并构建运行。

### 操作步骤

1. 访问 [railway.app](https://railway.app)，使用 GitHub 账号登录
2. 点击 **New Project** → **Deploy from GitHub repo**，选择 `tianyuan98/job-explain-copilot`
3. Railway 自动检测到 `backend/` 下的 Python 项目

### 环境变量配置

在 Railway 项目 Settings → Variables 中添加：

| 变量名 | 说明 | 示例值 |
|--------|------|--------|
| `LLM_API_KEY` | 智谱 API 密钥 | `your-zhipu-api-key` |
| `LLM_BASE_URL` | LLM 服务地址 | `https://open.bigmodel.cn/api/paas/v4` |
| `LLM_MODEL` | 模型名称 | `glm-4-flash` |

### 端口说明

Railway 默认监听 **8080** 端口。项目中已提供 `backend/Dockerfile`，会自动将 uvicorn 绑定到 8080 端口。若未使用 Dockerfile，需确保 `main.py` 中启动端口为 8080。

### 获取后端域名

部署成功后，Railway 会生成一个域名，格式类似 `https://xxx.up.railway.app`。在 Railway 项目 Settings → Domains 中复制该域名，后续前端部署需要用到。

---

## 3. 前端部署到 Vercel

### 操作步骤

1. 访问 [vercel.com](https://vercel.com)，使用 GitHub 账号登录
2. 点击 **Add New** → **Project**，选择 `tianyuan98/job-explain-copilot`
3. 配置以下选项：

| 配置项 | 值 |
|--------|-----|
| **Framework Preset** | Create React App |
| **Root Directory** | `frontend` |
| **Build Command** | `npm run build` |
| **Output Directory** | `build` |

### 环境变量配置

在 Vercel 项目 Settings → Environment Variables 中添加：

| 变量名 | 值 |
|--------|-----|
| `REACT_APP_API_URL` | Railway 后端域名（如 `https://xxx.up.railway.app/api/demo`） |

### 部署

点击 **Deploy**，Vercel 会自动构建并发布前端。

---

## 4. 前端代码适配

在 `frontend/src/pages/DemoPage.js` 中，`axios` 的 baseURL 已配置为优先使用环境变量，本地开发时自动回退到 `localhost:8000`：

```js
const API_BASE_URL = process.env.REACT_APP_API_URL || "http://localhost:8000/api/demo";
```

---

## 5. 推送代码触发自动部署

每次向 GitHub `main` 分支推送代码后：

- **Railway** 自动检测变更，重新构建并部署后端
- **Vercel** 自动检测变更，重新构建并部署前端

---

## 6. 最终验证

1. 打开 Vercel 分配的域名
2. 依次点击三个演示场景验证功能
