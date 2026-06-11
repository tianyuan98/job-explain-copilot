# 部署检查清单

> 此页面用于记录项目部署前的各项检查项，内容将在后续逐步填充。

---

## 启动步骤

- [ ] 在 backend 目录创建 .env 文件，填入 `LLM_API_KEY=你的智谱API密钥`
- [ ] 进入 backend 目录，运行 `pip install -r requirements.txt`
- [ ] 进入 backend 目录，运行 `python main.py` 启动后端（确保端口 8000）
- [ ] 进入 frontend 目录，运行 `npm install`
- [ ] 进入 frontend 目录，运行 `npm start` 启动前端（端口 3000）
- [ ] 浏览器访问 `http://localhost:3000` 测试演示功能

---

## 后端检查

- [ ] 依赖安装完整（`requirements.txt`）
- [ ] 环境变量配置正确（参考 `.env.example`）
- [ ] LLM 服务连通性验证
- [ ] API 接口测试通过

---

## 前端检查

- [ ] 依赖安装完整（`npm install`）
- [ ] 构建无报错（`npm run build`）
- [ ] 页面功能验证通过

---

## 部署环境

- [ ] 服务器资源准备就绪
- [ ] 域名 / SSL 配置完成
- [ ] CI/CD 流程确认

---

## 待补充

<!-- 后续根据实际部署情况补充更多检查项 -->
