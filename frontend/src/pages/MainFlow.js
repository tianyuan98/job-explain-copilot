import React, { useMemo, useRef, useState } from "react";
import axios from "axios";

const API_BASE_URL = process.env.REACT_APP_API_URL || "http://localhost:8000";

const steps = ["简历上传", "基本信息补充", "AI能力画像确认", "岗位推荐与解释"];

const baseFields = [
  { key: "name", label: "姓名", source: "学生填写" },
  { key: "school", label: "学校", source: "学生填写" },
  { key: "major", label: "专业", source: "学生填写" },
  { key: "degree", label: "学历", source: "学生填写" },
  { key: "project", label: "项目经历", source: "来自简历" },
  { key: "extra", label: "补充信息", source: "学生补充" },
];

function MainFlow() {
  const [currentStep, setCurrentStep] = useState(1);
  const [scenarioList, setScenarioList] = useState([]);
  const [detail, setDetail] = useState(null);
  const [formFields, setFormFields] = useState(baseFields.map(toEmptyField));
  const [loadedExample, setLoadedExample] = useState(false);
  const [resumeUploaded, setResumeUploaded] = useState(false);
  const [loadingExample, setLoadingExample] = useState(false);
  const [error, setError] = useState("");
  const [showExploreModal, setShowExploreModal] = useState(false);
  const [showAppealModal, setShowAppealModal] = useState(false);
  const [appealTarget, setAppealTarget] = useState("");
  const [appealReason, setAppealReason] = useState("");
  const [appealReport, setAppealReport] = useState("");
  const [resumeFileName, setResumeFileName] = useState("");

  const fileInputRef = useRef(null);

  const scenario = detail?.scenario;
  const archive = detail?.archive || scenario?.archive || [];
  const portrait = detail?.portrait || scenario?.portrait || "";
  const matchScore = scenario?.match_score || 0;

  const abilityCards = useMemo(() => parsePortrait(portrait), [portrait]);

  async function loadExampleData() {
    try {
      setLoadingExample(true);
      setError("");

      const scenariosResponse = await axios.get(`${API_BASE_URL}/api/demo/scenarios`);
      setScenarioList(scenariosResponse.data);

      const explainResponse = await axios.post(`${API_BASE_URL}/api/demo/explain`, {
        scenario_id: "demo_01",
      });

      const fullDetail = explainResponse.data;
      setDetail(fullDetail);
      setFormFields(buildFields(fullDetail));
      setAppealTarget(fullDetail.scenario.alternative_job || "");
      setAppealReason(fullDetail.scenario.appeal_reason || "");
      setAppealReport("");
      setLoadedExample(true);
      setResumeUploaded(true);
      setCurrentStep(1);
    } catch (requestError) {
      setError("示例数据暂时没有加载成功，请确认后端服务已启动。");
    } finally {
      setLoadingExample(false);
    }
  }

  function handleUploadClick() {
    fileInputRef.current?.click();
  }

  function handleFileChange(event) {
    const file = event.target.files?.[0];
    if (file) {
      setResumeFileName(file.name);
      setResumeUploaded(true);
    }
    // 重置 input 以便同一文件可重复选择
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }

  function updateField(index, value) {
    setFormFields((current) =>
      current.map((field, fieldIndex) =>
        fieldIndex === index ? { ...field, value } : field
      )
    );
  }

  function addMoreField() {
    setFormFields((current) => [
      ...current,
      {
        key: `extra_${Date.now()}`,
        label: "补充信息",
        value: "",
        source: "学生补充",
        editable: true,
      },
    ]);
  }

  function generateAppealReport(event) {
    event.preventDefault();

    if (!scenario) {
      return;
    }

    setAppealReport(
      [
        `学生姓名：${scenario.name}`,
        `原推荐岗位：${scenario.recommended_job}`,
        `申诉目标岗位：${appealTarget || scenario.alternative_job}`,
        `补充说明摘要：${appealReason || "学生希望补充更多材料供 HR 复审。"}`,
        `匹配度变化：当前岗位 ${scenario.match_score} 分，目标岗位 ${scenario.alt_match_score} 分`,
        "结语：建议人工复审",
      ].join("\n")
    );
  }

  return (
    <main className="main-flow">
      <style>{styles}</style>

      <header className="top-nav">
        <div className="brand">AI定岗解释官</div>
        <div className="nav-actions">
          <button
            className={`import-btn ${loadedExample ? "loaded" : ""}`}
            disabled={loadingExample || loadedExample}
            onClick={loadExampleData}
            type="button"
          >
            {loadedExample ? "已加载示例数据" : "📥 一键导入示例数据"}
          </button>
          <button className="about-link" type="button">
            关于
          </button>
        </div>
      </header>

      <section className="flow-shell">
        <nav className="stepper" aria-label="流程步骤">
          {steps.map((step, index) => {
            const stepNumber = index + 1;
            return (
              <div
                className={`step ${currentStep === stepNumber ? "active" : ""} ${
                  currentStep > stepNumber ? "done" : ""
                }`}
                key={step}
              >
                <span>{stepNumber}</span>
                <p>{step}</p>
              </div>
            );
          })}
        </nav>

        {error && <div className="soft-alert">{error}</div>}

        {currentStep === 1 && (
          <section className="content-card">
            <div className="section-heading">
              <p className="eyebrow">Step 1</p>
              <h1>上传你的简历</h1>
              <p>先让 AI 解释官读取基础资料，也可以跳过后手动补充。</p>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.docx"
              style={{ display: "none" }}
              onChange={handleFileChange}
            />

            <button
              className={`upload-zone ${resumeUploaded ? "uploaded" : ""}`}
              onClick={handleUploadClick}
              type="button"
            >
              {resumeUploaded ? (
                <>
                  <strong>{resumeFileName || (scenario ? `${scenario.name}_简历.pdf ✓` : "简历.pdf ✓")}</strong>
                  <span>已解析出关键字段</span>
                </>
              ) : (
                <>
                  <strong>点击或拖拽文件到这里</strong>
                  <span>支持 PDF、Word</span>
                </>
              )}
            </button>

            <div className="footer-actions">
              <button
                className="ghost-btn"
                onClick={() => setCurrentStep(2)}
                type="button"
              >
                跳过，手动填写
              </button>
              <button
                className="primary-btn"
                onClick={() => setCurrentStep(2)}
                type="button"
              >
                下一步 →
              </button>
            </div>
          </section>
        )}

        {currentStep === 2 && (
          <section className="content-card">
            <div className="section-heading">
              <p className="eyebrow">Step 2</p>
              <h1>完善你的个人档案</h1>
              <p>每一项资料都会帮助推荐更透明，也可以随时补充新信息。</p>
            </div>

            <div className="field-list">
              {formFields.map((field, index) => (
                <label className="field-row" key={field.key}>
                  <span className="field-meta">
                    <strong>{field.label}</strong>
                    <em>{field.source}</em>
                  </span>
                  <span className="input-wrap">
                    <input
                      onChange={(event) => updateField(index, event.target.value)}
                      placeholder={`请输入${field.label}`}
                      value={field.value}
                    />
                    <span aria-hidden="true">✎</span>
                  </span>
                </label>
              ))}
            </div>

            <button className="add-btn" onClick={addMoreField} type="button">
              + 补充更多信息
            </button>

            <div className="footer-actions">
              <button
                className="ghost-btn"
                onClick={() => setCurrentStep(1)}
                type="button"
              >
                ← 上一步
              </button>
              <button
                className="primary-btn"
                onClick={() => setCurrentStep(3)}
                type="button"
              >
                确认并生成能力画像 →
              </button>
            </div>
          </section>
        )}

        {currentStep === 3 && (
          <section className="content-card">
            <div className="section-heading">
              <p className="eyebrow">Step 3</p>
              <h1>你的 AI 能力画像</h1>
              <p>这份画像会作为岗位匹配的基础，如有异议可返回修改。</p>
            </div>

            <article className="portrait-card">
              <div className="ability-grid">
                {abilityCards.map((item) => (
                  <div className="ability-item" key={item.label}>
                    <span className={`ability-badge ${item.tone}`}>{item.level}</span>
                    <strong>{item.label}</strong>
                    <p>{item.detail}</p>
                  </div>
                ))}
              </div>

              <div className="portrait-text">{renderPortraitText(portrait)}</div>
            </article>

            <p className="hint">以上分析将作为岗位匹配的基础，如有异议可返回修改。</p>

            <div className="footer-actions">
              <button
                className="ghost-btn"
                onClick={() => setCurrentStep(2)}
                type="button"
              >
                ← 返回修改
              </button>
              <button
                className="primary-btn"
                onClick={() => setCurrentStep(4)}
                type="button"
              >
                开始岗位匹配 →
              </button>
            </div>
          </section>
        )}

        {currentStep === 4 && (
          <section className="content-card">
            <div className="section-heading">
              <p className="eyebrow">Step 4</p>
              <h1>岗位推荐与解释</h1>
              <p>推荐结果会说明为什么匹配，也给你探索和申诉的入口。</p>
            </div>

            {scenario ? (
              <article className="match-card">
                <div className="match-top">
                  <div
                    className="score-ring"
                    style={{
                      background: `conic-gradient(#5c7cfa ${
                        matchScore * 3.6
                      }deg, #edf1ff 0deg)`,
                    }}
                  >
                    <div className="score-center">
                      <strong>{matchScore}</strong>
                      <span>匹配度</span>
                    </div>
                  </div>

                  <div className="job-copy">
                    <p className="eyebrow">推荐岗位</p>
                    <h2>{scenario.recommended_job}</h2>
                    <p>{detail?.explanation}</p>
                  </div>
                </div>

                <ul className="reason-list">
                  {scenario.key_reasons.map((reason) => (
                    <li key={reason}>
                      <span>🔹</span>
                      <p>{reason}</p>
                    </li>
                  ))}
                </ul>

                <div className="match-actions">
                  <button
                    className="primary-btn"
                    onClick={() => setShowExploreModal(true)}
                    type="button"
                  >
                    🔄 探索其他可能岗位
                  </button>
                  <button
                    className="text-link"
                    onClick={() => setShowAppealModal(true)}
                    type="button"
                  >
                    觉得推荐不合适？点此发起申诉
                  </button>
                </div>
              </article>
            ) : (
              <div className="empty-state">
                请先导入示例数据，或完成前面的步骤后查看推荐结果。
              </div>
            )}
          </section>
        )}
      </section>

      {showExploreModal && scenario && (
        <Modal title="探索其他可能岗位" onClose={() => setShowExploreModal(false)}>
          <p className="eyebrow">目标岗位</p>
          <h3 className="modal-job">{scenario.alternative_job}</h3>
          <div className="score-pills">
            <span>匹配度 {scenario.alt_match_score}</span>
            <span>当前推荐 {scenario.match_score}</span>
          </div>
          <div className="modal-block">
            <h4>差距列表</h4>
            <ul className="gap-list">
              {scenario.alt_gaps.map((gap) => (
                <li key={gap}>❌ {gap}</li>
              ))}
            </ul>
          </div>
          <div className="modal-block">
            <h4>建议</h4>
            <p className="pre-line">{detail?.advice}</p>
          </div>
          <button className="primary-btn wide" type="button">
            发起岗位复审
          </button>
        </Modal>
      )}

      {showAppealModal && scenario && (
        <Modal title="申诉助手" onClose={() => setShowAppealModal(false)}>
          <form className="appeal-form" onSubmit={generateAppealReport}>
            <label>
              意向岗位
              <input
                onChange={(event) => setAppealTarget(event.target.value)}
                placeholder="例如：AI算法工程师"
                value={appealTarget}
              />
            </label>
            <label>
              补充说明
              <textarea
                onChange={(event) => setAppealReason(event.target.value)}
                placeholder="写下你希望补充给 HR 的经历、项目或作品集信息"
                rows="5"
                value={appealReason}
              />
            </label>
            <button className="primary-btn" type="submit">
              生成报告
            </button>
          </form>

          {appealReport && (
            <>
              <blockquote className="appeal-preview">{appealReport}</blockquote>
              <button className="primary-btn wide" type="button">
                提交申诉（演示）
              </button>
            </>
          )}
        </Modal>
      )}
    </main>
  );
}

function toEmptyField(field) {
  return { ...field, value: "", editable: true };
}

function buildFields(fullDetail) {
  const scenario = fullDetail.scenario;
  const archive = fullDetail.archive || scenario.archive || [];
  const archiveFields = archive.map((item, index) => ({
    key: `archive_${index}_${item.label}`,
    label: item.label,
    value: item.value,
    source: item.source,
    editable: item.editable,
  }));

  return [
    {
      key: "name",
      label: "姓名",
      value: scenario.name || "",
      source: "学生填写",
      editable: true,
    },
    {
      key: "school",
      label: "学校",
      value: "腾讯校园招聘候选人",
      source: "学生填写",
      editable: true,
    },
    {
      key: "major",
      label: "专业",
      value: "",
      source: "学生填写",
      editable: true,
    },
    {
      key: "degree",
      label: "学历",
      value: "",
      source: "学生填写",
      editable: true,
    },
    ...archiveFields,
    {
      key: "project",
      label: "项目经历",
      value: scenario.profile?.internship || "",
      source: "来自简历",
      editable: true,
    },
    {
      key: "extra",
      label: "补充信息",
      value: scenario.appeal_reason || "",
      source: "学生补充",
      editable: true,
    },
  ];
}

function parsePortrait(text) {
  const fallback = [
    { label: "算法思维", level: "待确认", detail: "等待资料补充", tone: "blue" },
    { label: "系统设计", level: "待确认", detail: "等待资料补充", tone: "blue" },
    { label: "工程实践", level: "待确认", detail: "等待资料补充", tone: "blue" },
    { label: "职业意向", level: "待确认", detail: "等待资料补充", tone: "blue" },
  ];

  if (!text) {
    return fallback;
  }

  const lines = text.split("\n").filter((line) => line.includes("："));
  const parsed = lines.slice(0, 4).map((line) => {
    const [label, ...rest] = line.split("：");
    const detail = rest.join("：");
    const level = extractLevel(detail);
    return {
      label,
      level,
      detail,
      tone: getTone(level, label),
    };
  });

  return parsed.length ? parsed : fallback;
}

function extractLevel(text) {
  const match = text.match(/较强|一般|中等|待补充|待提升|后端开发|产品经理|数据科学|数据分析/);
  return match ? match[0] : "已识别";
}

function getTone(level, label) {
  if (label.includes("职业意向")) return "blue";
  if (level === "较强") return "green";
  if (level === "一般" || level === "中等") return "yellow";
  if (level.includes("待")) return "orange";
  return "blue";
}

function renderPortraitText(text) {
  if (!text) {
    return <p>请先导入示例数据，AI 会在这里生成能力画像。</p>;
  }

  return text.split("\n").map((line, index) =>
    line.trim() ? <p key={`${line}-${index}`}>{line}</p> : <br key={`br-${index}`} />
  );
}

function Modal({ title, children, onClose }) {
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <section
        className="modal-card"
        onClick={(event) => event.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label={title}
      >
        <button className="modal-close" onClick={onClose} type="button">
          ×
        </button>
        <h2>{title}</h2>
        {children}
      </section>
    </div>
  );
}

const styles = `
  * {
    box-sizing: border-box;
  }

  .main-flow {
    min-height: 100vh;
    color: #26324a;
    background:
      radial-gradient(circle at 12% 8%, rgba(137, 220, 255, 0.32), transparent 28%),
      radial-gradient(circle at 88% 12%, rgba(220, 185, 255, 0.34), transparent 28%),
      linear-gradient(135deg, #f8fbff 0%, #eef6ff 48%, #f8f1ff 100%);
    font-family: "PingFang SC", "Microsoft YaHei", "Noto Sans CJK SC", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
  }

  .top-nav {
    position: sticky;
    top: 0;
    z-index: 20;
    display: flex;
    align-items: center;
    justify-content: space-between;
    min-height: 70px;
    padding: 0 32px;
    border-bottom: 1px solid rgba(92, 124, 250, 0.12);
    background: rgba(255, 255, 255, 0.84);
    backdrop-filter: blur(14px);
    box-shadow: 0 12px 34px rgba(82, 103, 161, 0.1);
  }

  .brand {
    color: #4e60d8;
    font-size: 20px;
    font-weight: 900;
  }

  .nav-actions {
    display: flex;
    align-items: center;
    gap: 12px;
  }

  .import-btn,
  .primary-btn,
  .ghost-btn,
  .add-btn,
  .about-link,
  .text-link,
  .modal-close,
  .upload-zone {
    border: 0;
    cursor: pointer;
    font: inherit;
    transition: transform 160ms ease, box-shadow 160ms ease, background 160ms ease, color 160ms ease, border-color 160ms ease;
  }

  .import-btn,
  .primary-btn {
    border-radius: 8px;
    background: linear-gradient(135deg, #5c7cfa, #9b6dff);
    color: white;
    font-weight: 900;
    box-shadow: 0 14px 30px rgba(92, 124, 250, 0.28);
  }

  .import-btn {
    padding: 11px 16px;
  }

  .import-btn.loaded,
  .import-btn:disabled {
    background: #dce3ef;
    color: #6d7891;
    box-shadow: none;
    cursor: default;
  }

  .about-link {
    background: transparent;
    color: #60708b;
    font-weight: 800;
  }

  .flow-shell {
    width: min(1120px, calc(100% - 32px));
    margin: 0 auto;
    padding: 30px 0 72px;
  }

  .stepper {
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: 12px;
    margin-bottom: 22px;
  }

  .step {
    text-align: center;
    padding: 16px 0;
    border-radius: 8px;
    background: rgba(255, 255, 255, 0.6);
    border: 1px solid #e0e4ff;
    transition: background 180ms ease;
  }

  .step span {
    display: inline-grid;
    place-items: center;
    width: 32px;
    height: 32px;
    border-radius: 50%;
    background: #e0e4ff;
    color: #5c6782;
    font-weight: 900;
    margin-bottom: 8px;
  }

  .step p {
    margin: 0;
    font-size: 14px;
    font-weight: 700;
    color: #5c6782;
  }

  .step.active {
    background: white;
    border-color: #5c7cfa;
    box-shadow: 0 8px 24px rgba(92, 124, 250, 0.16);
  }

  .step.active span {
    background: #5c7cfa;
    color: white;
  }

  .step.active p {
    color: #26324a;
  }

  .step.done {
    background: rgba(92, 124, 250, 0.08);
    border-color: rgba(92, 124, 250, 0.24);
  }

  .step.done span {
    background: #c5d2ff;
    color: #4e60d8;
  }

  .soft-alert {
    padding: 14px 16px;
    border-radius: 8px;
    background: #fff8ed;
    border: 1px solid #ffe0b8;
    color: #b0680a;
    margin-bottom: 18px;
  }

  .content-card {
    background: white;
    border-radius: 12px;
    border: 1px solid #e7ebfa;
    padding: 36px;
    box-shadow: 0 12px 40px rgba(82, 103, 161, 0.08);
  }

  .section-heading {
    margin-bottom: 28px;
  }

  .eyebrow {
    margin: 0 0 8px;
    color: #5c7cfa;
    font-size: 13px;
    font-weight: 800;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  .section-heading h1 {
    margin: 0 0 8px;
    font-size: 28px;
  }

  .section-heading p {
    margin: 0;
    color: #60708b;
  }

  .upload-zone {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    width: 100%;
    min-height: 160px;
    border: 2px dashed #c8d2f0;
    border-radius: 12px;
    background: #fafbff;
    margin-bottom: 24px;
    gap: 6px;
  }

  .upload-zone.uploaded {
    border-color: #5c7cfa;
    background: #f0f3ff;
  }

  .upload-zone strong {
    font-size: 18px;
    color: #26324a;
  }

  .upload-zone span {
    color: #7a88a5;
  }

  .field-list {
    display: grid;
    gap: 14px;
    margin-bottom: 14px;
  }

  .field-row {
    display: grid;
    grid-template-columns: 180px 1fr;
    gap: 12px;
    align-items: center;
  }

  .field-meta {
    display: flex;
    flex-direction: column;
  }

  .field-meta em {
    font-size: 12px;
    color: #8c97b5;
    font-style: normal;
  }

  .input-wrap {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .input-wrap input,
  .appeal-form input,
  .appeal-form textarea {
    flex: 1;
    padding: 10px 14px;
    border: 1px solid #d8dff5;
    border-radius: 8px;
    font: inherit;
    color: #26324a;
    outline: none;
    transition: border-color 160ms ease, box-shadow 160ms ease;
  }

  .input-wrap input:focus,
  .appeal-form input:focus,
  .appeal-form textarea:focus {
    border-color: #5c7cfa;
    box-shadow: 0 0 0 4px rgba(92, 124, 250, 0.12);
  }

  .add-btn {
    background: transparent;
    color: #5c7cfa;
    font-weight: 800;
    margin-bottom: 24px;
  }

  .ghost-btn {
    background: transparent;
    border: 1px solid #d8dff5;
    border-radius: 8px;
    padding: 12px 18px;
    color: #60708b;
    font-weight: 800;
  }

  .primary-btn {
    padding: 14px 22px;
  }

  .primary-btn:hover,
  .import-btn:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow: 0 18px 38px rgba(92, 124, 250, 0.34);
  }

  .footer-actions {
    display: flex;
    justify-content: flex-end;
    gap: 12px;
  }

  .portrait-card {
    border: 1px solid #e7ebfa;
    border-radius: 12px;
    padding: 24px;
    background: #fafbff;
  }

  .ability-grid {
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: 14px;
    margin-bottom: 20px;
  }

  .ability-item {
    text-align: center;
    padding: 16px 10px;
    border-radius: 8px;
    background: white;
    border: 1px solid #eef1fc;
  }

  .ability-badge {
    display: inline-block;
    padding: 3px 10px;
    border-radius: 999px;
    font-size: 12px;
    font-weight: 800;
    margin-bottom: 8px;
  }

  .ability-badge.green { background: #e4f7ed; color: #1a8a4a; }
  .ability-badge.blue { background: #e6edff; color: #4e60d8; }
  .ability-badge.yellow { background: #fff5e0; color: #b37b0a; }
  .ability-badge.orange { background: #ffeae0; color: #c0520a; }

  .ability-item strong {
    display: block;
    margin-bottom: 4px;
    font-size: 14px;
  }

  .ability-item p {
    margin: 0;
    font-size: 13px;
    color: #60708b;
    line-height: 1.5;
  }

  .portrait-text {
    padding: 16px;
    background: white;
    border-radius: 8px;
    border: 1px solid #edf0f9;
    font-size: 14px;
    line-height: 1.8;
    color: #42506a;
  }

  .hint {
    margin: 14px 0 24px;
    font-size: 13px;
    color: #8c97b5;
  }

  .match-card {
    border-radius: 12px;
  }

  .match-top {
    display: grid;
    grid-template-columns: 132px 1fr;
    gap: 24px;
    align-items: center;
    padding-bottom: 24px;
    border-bottom: 1px solid #e7ebfa;
  }

  .score-ring {
    display: grid;
    place-items: center;
    width: 132px;
    height: 132px;
    border-radius: 50%;
  }

  .score-center {
    display: grid;
    place-items: center;
    align-content: center;
    width: 104px;
    height: 104px;
    border-radius: 50%;
    background: white;
  }

  .score-center strong {
    font-size: 42px;
    color: #5c7cfa;
  }

  .score-center span {
    font-size: 13px;
    color: #8c97b5;
  }

  .job-copy h2 {
    margin: 0 0 8px;
    font-size: 28px;
  }

  .job-copy p {
    margin: 0;
    color: #42506a;
    line-height: 1.7;
  }

  .reason-list {
    list-style: none;
    padding: 0;
    margin: 20px 0;
    display: grid;
    gap: 10px;
  }

  .reason-list li {
    display: flex;
    gap: 10px;
    align-items: flex-start;
    color: #42506a;
  }

  .reason-list li span {
    color: #5c7cfa;
    flex-shrink: 0;
  }

  .match-actions {
    display: flex;
    gap: 14px;
    align-items: center;
  }

  .text-link {
    background: transparent;
    color: #5c7cfa;
    font-weight: 700;
    font-size: 14px;
  }

  .empty-state {
    padding: 40px;
    text-align: center;
    color: #8c97b5;
  }

  .modal-backdrop {
    position: fixed;
    inset: 0;
    z-index: 30;
    display: grid;
    place-items: center;
    padding: 22px;
    background: rgba(29, 38, 61, 0.42);
    backdrop-filter: blur(10px);
  }

  .modal-card {
    position: relative;
    width: min(760px, 100%);
    max-height: min(82vh, 760px);
    overflow: auto;
    padding: 30px;
    border-radius: 8px;
    background: white;
    box-shadow: 0 30px 90px rgba(29, 38, 61, 0.26);
  }

  .modal-card h2 {
    margin: 0 0 18px;
    font-size: 30px;
  }

  .modal-close {
    position: absolute;
    top: 18px;
    right: 18px;
    width: 36px;
    height: 36px;
    border-radius: 50%;
    background: #f2f5fb;
    color: #58657d;
    font-size: 24px;
  }

  .modal-job {
    margin: 0 0 14px;
    font-size: 28px;
  }

  .score-pills {
    display: flex;
    flex-wrap: wrap;
    gap: 10px;
    margin-bottom: 18px;
  }

  .score-pills span {
    padding: 9px 12px;
    border-radius: 999px;
    background: #f0f3ff;
    color: #5360c9;
    font-weight: 900;
  }

  .modal-block {
    padding: 18px 0;
    border-top: 1px solid #e7ebfa;
  }

  .modal-block h4 {
    margin: 0 0 12px;
    font-size: 18px;
  }

  .gap-list {
    display: grid;
    gap: 10px;
    margin: 0;
    padding: 0;
    list-style: none;
    color: #42506a;
    line-height: 1.7;
  }

  .pre-line {
    margin: 0;
    color: #42506a;
    line-height: 1.85;
    white-space: pre-line;
  }

  .wide {
    width: 100%;
    margin-top: 18px;
  }

  .appeal-form {
    display: grid;
    gap: 16px;
  }

  .appeal-form label {
    display: grid;
    gap: 8px;
    color: #42506a;
    font-weight: 900;
  }

  .appeal-form textarea {
    padding-right: 13px;
    resize: vertical;
  }

  .appeal-preview {
    margin: 22px 0 0;
    padding: 18px 20px;
    border: 0;
    border-radius: 8px;
    background: #f3f5f9;
    color: #42506a;
    line-height: 1.8;
    white-space: pre-line;
  }

  @media (max-width: 900px) {
    .top-nav {
      padding: 12px 18px;
      align-items: flex-start;
      flex-direction: column;
      gap: 12px;
    }

    .stepper,
    .ability-grid {
      grid-template-columns: 1fr 1fr;
    }

    .field-row,
    .match-top {
      grid-template-columns: 1fr;
    }
  }

  @media (max-width: 620px) {
    .flow-shell {
      width: min(100% - 24px, 1120px);
    }

    .content-card {
      padding: 22px;
    }

    .stepper,
    .ability-grid {
      grid-template-columns: 1fr;
    }

    .nav-actions,
    .footer-actions,
    .match-actions {
      width: 100%;
      align-items: stretch;
      flex-direction: column;
    }
  }
`;

export default MainFlow;
