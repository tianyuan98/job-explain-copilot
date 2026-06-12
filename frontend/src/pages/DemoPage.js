import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";

const API_BASE_URL = process.env.REACT_APP_API_URL || "http://localhost:8000";

const studentIntro = {
  demo_01: "云计算与后端研发方向",
  demo_02: "前端交互与数据分析方向",
  demo_03: "硬件测试与产品探索方向",
};

const studentColors = {
  demo_01: "linear-gradient(135deg, #4f8cff, #7bdff2)",
  demo_02: "linear-gradient(135deg, #7c5cff, #f0abfc)",
  demo_03: "linear-gradient(135deg, #18b7a7, #ffd166)",
};

const steps = ["确认档案", "AI画像", "岗位匹配"];

function DemoPage() {
  const [step, setStep] = useState(1);
  const [scenarios, setScenarios] = useState([]);
  const [selectedId, setSelectedId] = useState("");
  const [detail, setDetail] = useState(null);
  const [archive, setArchive] = useState([]);
  const [loadingList, setLoadingList] = useState(true);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [error, setError] = useState("");
  const [showGrowthModal, setShowGrowthModal] = useState(false);
  const [showAppealModal, setShowAppealModal] = useState(false);
  const [appealTarget, setAppealTarget] = useState("");
  const [appealReason, setAppealReason] = useState("");
  const [appealPreview, setAppealPreview] = useState("");

  useEffect(() => {
    async function loadScenarios() {
      try {
        setLoadingList(true);
        setError("");
        const response = await axios.get(`${API_BASE_URL}/api/demo/scenarios`);
        setScenarios(response.data);
      } catch (requestError) {
        setError("演示名单暂时没有加载成功，请确认服务已启动后再试。");
      } finally {
        setLoadingList(false);
      }
    }

    loadScenarios();
  }, []);

  const scenario = detail?.scenario;
  const matchScore = scenario?.match_score || 0;

  const selectedBrief = useMemo(() => {
    return scenarios.find((item) => item.id === selectedId);
  }, [scenarios, selectedId]);

  async function handleSelectStudent(scenarioId) {
    try {
      setSelectedId(scenarioId);
      setLoadingDetail(true);
      setError("");
      setShowGrowthModal(false);
      setShowAppealModal(false);
      setAppealPreview("");

      const response = await axios.post(`${API_BASE_URL}/api/demo/explain`, {
        scenario_id: scenarioId,
      });

      setDetail(response.data);
      setArchive(response.data.archive || response.data.scenario.archive || []);
      setAppealTarget(response.data.scenario.alternative_job);
      setAppealReason(response.data.scenario.appeal_reason);
      setStep(1);
    } catch (requestError) {
      setError("这位同学的完整资料暂时没有生成成功，请稍后再试。");
    } finally {
      setLoadingDetail(false);
    }
  }

  function updateArchive(index, field, value) {
    setArchive((current) =>
      current.map((item, itemIndex) =>
        itemIndex === index ? { ...item, [field]: value } : item
      )
    );
  }

  function addArchiveItem() {
    setArchive((current) => [
      ...current,
      {
        label: "补充资料",
        value: "",
        source: "学生补充",
        editable: true,
      },
    ]);
  }

  function confirmArchive() {
    setStep(2);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function startMatching() {
    setStep(3);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function resetDemo() {
    setStep(1);
    setSelectedId("");
    setDetail(null);
    setArchive([]);
    setShowGrowthModal(false);
    setShowAppealModal(false);
    setAppealPreview("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function submitAppeal(event) {
    event.preventDefault();

    if (!scenario) {
      return;
    }

    // 演示用本地预览，不会提交到后端。
    setAppealPreview(
      [
        `学生姓名：${scenario.name}`,
        `原推荐岗位：${scenario.recommended_job}`,
        `申诉目标岗位：${appealTarget || scenario.alternative_job}`,
        `补充说明摘要：${appealReason || "学生希望补充更多经历供复审参考。"}`,
        `匹配度变化：当前 ${scenario.match_score} 分，目标岗位 ${scenario.alt_match_score} 分`,
        "结语：建议人工复审",
      ].join("\n")
    );
  }

  return (
    <main className="demo-page">
      <style>{styles}</style>

      <section className="hero">
        <p className="kicker">Campus Hiring AI</p>
        <h1>你的专属岗位推荐已生成</h1>
        <p>从档案确认到能力画像，再到岗位匹配，让每一步推荐都有依据。</p>
      </section>

      <nav className="stepper" aria-label="演示步骤">
        {steps.map((label, index) => {
          const currentStep = index + 1;
          return (
            <div
              className={`step-item ${step === currentStep ? "active" : ""} ${
                step > currentStep ? "done" : ""
              }`}
              key={label}
            >
              <span>{currentStep}</span>
              <p>步骤{currentStep} {label}</p>
            </div>
          );
        })}
      </nav>

      {error && <div className="soft-alert">{error}</div>}

      {step === 1 && (
        <section className="panel">
          <div className="section-title">
            <p className="kicker">Step 1</p>
            <h2>请确认你的个人档案</h2>
            <p>先选择一位演示学生，再确认或补充用于推荐分析的资料。</p>
          </div>

          {!selectedId && (
            <div className="student-grid">
              {loadingList ? (
                <div className="empty-card">正在准备学生档案...</div>
              ) : (
                scenarios.map((item) => (
                  <button
                    className="student-card"
                    key={item.id}
                    onClick={() => handleSelectStudent(item.id)}
                    type="button"
                  >
                    <span
                      className="avatar"
                      style={{ background: studentColors[item.id] }}
                    >
                      {item.name.slice(-1)}
                    </span>
                    <strong>{item.name}</strong>
                    <p>{studentIntro[item.id] || item.recommended_job}</p>
                  </button>
                ))
              )}
            </div>
          )}

          {loadingDetail && <div className="empty-card">正在读取完整档案...</div>}

          {selectedId && !loadingDetail && scenario && (
            <div className="archive-area">
              <div className="selected-student">
                <span
                  className="avatar small"
                  style={{ background: studentColors[selectedId] }}
                >
                  {scenario.name.slice(-1)}
                </span>
                <div>
                  <strong>{scenario.name}</strong>
                  <p>{studentIntro[selectedId] || selectedBrief?.recommended_job}</p>
                </div>
              </div>

              <div className="archive-list">
                {archive.map((item, index) => (
                  <article className="archive-row" key={`${item.label}-${index}`}>
                    <div className="archive-label">
                      <input
                        aria-label="档案条目名称"
                        onChange={(event) =>
                          updateArchive(index, "label", event.target.value)
                        }
                        value={item.label}
                      />
                      <span>{item.source}</span>
                    </div>
                    <input
                      aria-label={`${item.label} 当前值`}
                      className="archive-value"
                      disabled={!item.editable}
                      onChange={(event) =>
                        updateArchive(index, "value", event.target.value)
                      }
                      value={item.value}
                    />
                  </article>
                ))}
              </div>

              <div className="archive-actions">
                <button className="ghost-button" onClick={addArchiveItem} type="button">
                  + 补充
                </button>
                <button
                  className="primary-button"
                  onClick={confirmArchive}
                  type="button"
                >
                  确认并生成画像
                </button>
              </div>
            </div>
          )}
        </section>
      )}

      {step === 2 && scenario && (
        <section className="panel portrait-panel">
          <div className="section-title">
            <p className="kicker">Step 2</p>
            <h2>AI画像生成</h2>
            <p>AI 解释官正在把你确认过的资料整理成清晰的能力速览。</p>
          </div>

          <div className="spark-loader">
            <span />
            <span />
            <span />
          </div>

          <article className="portrait-card">
            <h3>你的能力速览（基于你确认的资料）</h3>
            <div className="portrait-text">
              {formatPortrait(detail.portrait || scenario.portrait)}
            </div>
          </article>

          <button className="primary-button wide" onClick={startMatching} type="button">
            开始岗位匹配 →
          </button>
        </section>
      )}

      {step === 3 && scenario && (
        <section className="panel">
          <div className="section-title with-action">
            <div>
              <p className="kicker">Step 3</p>
              <h2>岗位推荐结果</h2>
              <p>以下推荐基于你的确认档案与能力画像生成。</p>
            </div>
            <button className="ghost-button" onClick={resetDemo} type="button">
              返回顶部重新选择
            </button>
          </div>

          <article className="match-card">
            <div className="match-top">
              <div
                className="score-ring"
                style={{
                  background: `conic-gradient(#6c72ff ${
                    matchScore * 3.6
                  }deg, #edf0ff 0deg)`,
                }}
              >
                <div className="score-center">
                  <strong>{matchScore}</strong>
                  <span>匹配度</span>
                </div>
              </div>

              <div>
                <p className="kicker">推荐岗位</p>
                <h3>{scenario.recommended_job}</h3>
                <p className="match-summary">{detail.explanation}</p>
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
                className="primary-button"
                onClick={() => setShowGrowthModal(true)}
                type="button"
              >
                探索其他岗位
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
        </section>
      )}

      {showGrowthModal && scenario && (
        <Modal title="探索其他岗位" onClose={() => setShowGrowthModal(false)}>
          <p className="kicker">目标岗位</p>
          <h3 className="modal-job">{scenario.alternative_job}</h3>
          <div className="score-pills">
            <span>当前匹配度 {scenario.match_score}</span>
            <span>目标岗位匹配度 {scenario.alt_match_score}</span>
          </div>
          <div className="modal-block">
            <h4>差距分析</h4>
            <ul className="gap-list">
              {scenario.alt_gaps.map((gap) => (
                <li key={gap}>❌ {gap}</li>
              ))}
            </ul>
          </div>
          <div className="modal-block">
            <h4>建议补充材料</h4>
            <p className="pre-line">✅ {detail.advice}</p>
          </div>
        </Modal>
      )}

      {showAppealModal && scenario && (
        <Modal title="申诉助手" onClose={() => setShowAppealModal(false)}>
          <form className="appeal-form" onSubmit={submitAppeal}>
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
            <button className="primary-button" type="submit">
              生成申诉报告预览
            </button>
          </form>

          {appealPreview && (
            <blockquote className="appeal-preview">{appealPreview}</blockquote>
          )}
        </Modal>
      )}
    </main>
  );
}

function formatPortrait(text) {
  return text.split("\n").map((line, index) => {
    if (!line.trim()) {
      return <br key={`break-${index}`} />;
    }

    const [label, ...rest] = line.split("：");
    const content = rest.join("：");

    if (!content) {
      return <p key={line}>{line}</p>;
    }

    return (
      <p key={`${label}-${index}`}>
        <strong>{label}：</strong>
        {highlightLevel(content)}
      </p>
    );
  });
}

function highlightLevel(text) {
  const parts = text.split(/(较强|一般|中等|待补充|待提升)/g);
  return parts.map((part, index) => {
    if (["较强", "一般", "中等", "待补充", "待提升"].includes(part)) {
      return (
        <span className={`level level-${part}`} key={`${part}-${index}`}>
          {part}
        </span>
      );
    }

    return <React.Fragment key={`${part}-${index}`}>{part}</React.Fragment>;
  });
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

  .demo-page {
    min-height: 100vh;
    padding: 44px 22px 72px;
    color: #25304a;
    background:
      radial-gradient(circle at 10% 8%, rgba(137, 220, 255, 0.32), transparent 30%),
      radial-gradient(circle at 88% 12%, rgba(220, 185, 255, 0.34), transparent 28%),
      linear-gradient(135deg, #f8fbff 0%, #eef6ff 48%, #f8f1ff 100%);
    font-family: "PingFang SC", "Microsoft YaHei", "Noto Sans CJK SC", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
  }

  .hero,
  .stepper,
  .panel,
  .soft-alert {
    width: min(1120px, 100%);
    margin-left: auto;
    margin-right: auto;
  }

  .hero {
    margin-bottom: 24px;
    text-align: center;
  }

  .kicker {
    margin: 0 0 10px;
    color: #6c72ff;
    font-size: 13px;
    font-weight: 900;
    letter-spacing: 0;
    text-transform: uppercase;
  }

  .hero h1 {
    margin: 0;
    font-size: clamp(34px, 6vw, 58px);
    line-height: 1.12;
    letter-spacing: 0;
  }

  .hero p:last-child,
  .section-title p {
    color: #6d7891;
    font-size: 17px;
    line-height: 1.8;
  }

  .stepper {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 12px;
    margin-bottom: 22px;
  }

  .step-item {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 14px 16px;
    border: 1px solid rgba(108, 114, 255, 0.12);
    border-radius: 8px;
    background: rgba(255, 255, 255, 0.7);
    color: #7b8498;
    box-shadow: 0 14px 34px rgba(82, 103, 161, 0.09);
  }

  .step-item span {
    display: grid;
    width: 34px;
    height: 34px;
    place-items: center;
    border-radius: 50%;
    background: #edf1ff;
    color: #6c72ff;
    font-weight: 900;
  }

  .step-item p {
    margin: 0;
    font-weight: 900;
  }

  .step-item.active,
  .step-item.done {
    border-color: rgba(108, 114, 255, 0.42);
    background: rgba(255, 255, 255, 0.94);
    color: #25304a;
  }

  .step-item.active span,
  .step-item.done span {
    background: linear-gradient(135deg, #6c72ff, #9b6dff);
    color: white;
  }

  .soft-alert,
  .panel,
  .empty-card {
    border: 1px solid rgba(108, 114, 255, 0.14);
    border-radius: 8px;
    background: rgba(255, 255, 255, 0.86);
    box-shadow: 0 22px 60px rgba(82, 103, 161, 0.13);
  }

  .soft-alert {
    margin-bottom: 18px;
    padding: 14px 18px;
    color: #9a4b00;
  }

  .panel {
    padding: 30px;
  }

  .section-title {
    margin-bottom: 24px;
  }

  .section-title h2 {
    margin: 0 0 8px;
    font-size: clamp(28px, 4vw, 40px);
    line-height: 1.18;
  }

  .section-title p {
    margin: 0;
  }

  .section-title.with-action {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 18px;
  }

  .student-grid {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 18px;
  }

  .student-card {
    min-height: 176px;
    padding: 24px;
    border: 2px solid transparent;
    border-radius: 8px;
    background: rgba(255, 255, 255, 0.88);
    color: inherit;
    cursor: pointer;
    text-align: left;
    box-shadow: 0 18px 44px rgba(82, 103, 161, 0.13);
    transition: transform 180ms ease, box-shadow 180ms ease, border-color 180ms ease;
  }

  .student-card:hover {
    transform: translateY(-5px);
    border-color: rgba(108, 114, 255, 0.42);
    box-shadow: 0 26px 62px rgba(82, 103, 161, 0.2);
  }

  .avatar {
    display: grid;
    width: 62px;
    height: 62px;
    margin-bottom: 18px;
    place-items: center;
    border-radius: 50%;
    color: white;
    font-size: 25px;
    font-weight: 900;
    box-shadow: inset 0 -10px 22px rgba(0, 0, 0, 0.12);
  }

  .avatar.small {
    width: 48px;
    height: 48px;
    margin: 0;
    font-size: 20px;
  }

  .student-card strong {
    display: block;
    margin-bottom: 8px;
    font-size: 24px;
  }

  .student-card p,
  .selected-student p {
    margin: 0;
    color: #6d7891;
    line-height: 1.6;
  }

  .empty-card {
    grid-column: 1 / -1;
    padding: 32px;
    color: #6d7891;
    text-align: center;
  }

  .selected-student {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-bottom: 18px;
    padding: 16px;
    border-radius: 8px;
    background: #f7f9ff;
  }

  .selected-student strong {
    font-size: 20px;
  }

  .archive-list {
    display: grid;
    gap: 12px;
  }

  .archive-row {
    display: grid;
    grid-template-columns: minmax(190px, 0.8fr) 1.2fr;
    gap: 14px;
    align-items: center;
    padding: 16px;
    border-radius: 8px;
    background: #fbfcff;
    border: 1px solid #e7ebfa;
  }

  .archive-label {
    display: grid;
    gap: 8px;
  }

  .archive-label span {
    width: fit-content;
    padding: 4px 9px;
    border-radius: 999px;
    background: #edf1ff;
    color: #6c72ff;
    font-size: 12px;
    font-weight: 800;
  }

  .archive-row input,
  .appeal-form input,
  .appeal-form textarea {
    width: 100%;
    border: 1px solid #dce3f4;
    border-radius: 8px;
    padding: 11px 12px;
    color: #25304a;
    background: white;
    font: inherit;
    outline: none;
    transition: border-color 160ms ease, box-shadow 160ms ease;
  }

  .archive-row input:focus,
  .appeal-form input:focus,
  .appeal-form textarea:focus {
    border-color: #6c72ff;
    box-shadow: 0 0 0 4px rgba(108, 114, 255, 0.12);
  }

  .archive-actions,
  .match-actions {
    display: flex;
    flex-wrap: wrap;
    gap: 12px;
    margin-top: 22px;
  }

  .primary-button,
  .ghost-button,
  .text-link,
  .modal-close {
    border: 0;
    cursor: pointer;
    font: inherit;
    transition: transform 160ms ease, box-shadow 160ms ease, background 160ms ease, color 160ms ease;
  }

  .primary-button,
  .ghost-button {
    padding: 13px 20px;
    border-radius: 8px;
    font-weight: 900;
  }

  .primary-button {
    background: linear-gradient(135deg, #6c72ff, #9b6dff);
    color: white;
    box-shadow: 0 14px 30px rgba(108, 114, 255, 0.28);
  }

  .primary-button:hover,
  .ghost-button:hover {
    transform: translateY(-2px);
  }

  .ghost-button {
    border: 1px solid #dce3f4;
    background: white;
    color: #5d67d8;
  }

  .wide {
    width: 100%;
    margin-top: 22px;
  }

  .portrait-panel {
    overflow: hidden;
  }

  .spark-loader {
    display: flex;
    justify-content: center;
    gap: 8px;
    margin: 4px 0 20px;
  }

  .spark-loader span {
    width: 10px;
    height: 10px;
    border-radius: 50%;
    background: #8c72ff;
    animation: pulse 900ms ease-in-out infinite;
  }

  .spark-loader span:nth-child(2) {
    animation-delay: 120ms;
  }

  .spark-loader span:nth-child(3) {
    animation-delay: 240ms;
  }

  @keyframes pulse {
    0%, 100% {
      opacity: 0.35;
      transform: translateY(0);
    }
    50% {
      opacity: 1;
      transform: translateY(-6px);
    }
  }

  .portrait-card {
    padding: 24px;
    border-radius: 8px;
    background: linear-gradient(135deg, #ffffff, #f7f8ff);
    border: 1px solid #e6eafd;
  }

  .portrait-card h3 {
    margin: 0 0 18px;
    font-size: 24px;
  }

  .portrait-text p {
    margin: 0 0 12px;
    color: #42506a;
    font-size: 16px;
    line-height: 1.85;
  }

  .portrait-text strong {
    color: #25304a;
  }

  .level {
    display: inline-block;
    margin: 0 4px;
    padding: 2px 8px;
    border-radius: 999px;
    font-weight: 900;
  }

  .level-较强 {
    background: #e8fff6;
    color: #087f5b;
  }

  .level-一般,
  .level-中等 {
    background: #fff7df;
    color: #9a6500;
  }

  .level-待补充,
  .level-待提升 {
    background: #fff0f0;
    color: #b42318;
  }

  .match-card {
    padding: 26px;
    border-radius: 8px;
    background: linear-gradient(135deg, #ffffff, #f7fbff);
    border: 1px solid #e7ebfa;
  }

  .match-top {
    display: grid;
    grid-template-columns: 140px 1fr;
    gap: 26px;
    align-items: center;
    padding-bottom: 24px;
    border-bottom: 1px solid #e7ebfa;
  }

  .score-ring {
    display: grid;
    width: 120px;
    height: 120px;
    place-items: center;
    border-radius: 50%;
  }

  .score-center {
    display: grid;
    width: 92px;
    height: 92px;
    place-items: center;
    align-content: center;
    border-radius: 50%;
    background: white;
  }

  .score-center strong {
    color: #5d67d8;
    font-size: 42px;
    line-height: 1;
  }

  .score-center span {
    margin-top: 6px;
    color: #7b8498;
    font-size: 13px;
  }

  .match-top h3 {
    margin: 0 0 10px;
    font-size: clamp(30px, 4vw, 44px);
    line-height: 1.16;
  }

  .match-summary {
    margin: 0;
    color: #526078;
    line-height: 1.85;
    white-space: pre-line;
  }

  .reason-list {
    display: grid;
    gap: 12px;
    margin: 26px 0;
    padding: 0;
    list-style: none;
  }

  .reason-list li {
    display: grid;
    grid-template-columns: 30px 1fr;
    align-items: start;
    padding: 14px 16px;
    border-radius: 8px;
    background: #f6f8ff;
    color: #33405c;
    line-height: 1.65;
  }

  .reason-list p {
    margin: 0;
  }

  .text-link {
    padding: 10px 0;
    background: transparent;
    color: #66728a;
    font-weight: 800;
  }

  .text-link:hover {
    color: #6c72ff;
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

  @media (max-width: 840px) {
    .demo-page {
      padding: 32px 16px 56px;
    }

    .stepper,
    .student-grid {
      grid-template-columns: 1fr;
    }

    .panel {
      padding: 22px;
    }

    .section-title.with-action {
      display: block;
    }

    .archive-row,
    .match-top {
      grid-template-columns: 1fr;
    }
  }
`;

export default DemoPage;
