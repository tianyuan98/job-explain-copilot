# GitHub + Vercel + Railway 部署方案

> 本方案将后端部署到 Railway（Python FastAPI），前端部署到 Vercel（React），通过 GitHub 自动触发部署。

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

Railway 默认监听 **8080** 端口。项目中已提供 `backend/Dockerfile`，会自动将 uvicorn 绑定到 8080 端口。若未使用 Dockerfile，需确保 `main.py` 中启动端口为 8080：

```python
uvicorn.run(app, host="0.0.0.0", port=8080)
```

### 获取后端域名

部署成功后，Railway 会生成一个域名，格式类似 `https://job-explain-copilot.up.railway.app`。在 Railway 项目 Settings → Domains 中复制该域名，后续前端部署需要用到。

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
| `REACT_APP_API_URL` | Railway 后端域名（如 `https://job-explain-copilot.up.railway.app/api/demo`） |

### 部署

点击 **Deploy**，Vercel 会自动构建并发布前端。

---

## 4. 前端代码适配

在 `frontend/src/pages/DemoPage.js` 中，`axios` 的 baseURL 已配置为优先使用环境变量，本地开发时自动回退到 `localhost:8000`：

```js
const API_BASE_URL = process.env.REACT_APP_API_URL || "http://localhost:8000/api/demo";
```

这样本地 `npm start` 无需任何改动即可正常工作，部署到 Vercel 后自动读取 `REACT_APP_API_URL` 指向 Railway 后端。

---

## 5. 推送代码触发自动部署

每次向 GitHub `main` 分支推送代码后：

- **Railway** 自动检测变更，重新构建并部署后端
- **Vercel** 自动检测变更，重新构建并部署前端

无需手动操作，全程 CI/CD 自动化。

---

## 6. 最终验证

1. 打开 Vercel 分配的域名（如 `https://job-explain-copilot.vercel.app`）
2. 依次点击三个演示场景，验证：
   - 场景1（李明）→ 云研发匹配解释
   - 场景2（王婷）→ 数据科学成长建议
   - 场景3（张伟）→ 产品经理申诉报告
3. 确认所有 API 调用正常、页面渲染完整
