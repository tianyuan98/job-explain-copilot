import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";

const API_BASE_URL = process.env.REACT_APP_API_URL || "http://localhost:8000";

const studentMeta = {
  demo_01: {
    intro: "云计算方向",
    color: "linear-gradient(135deg, #4f8cff, #7bdff2)",
  },
  demo_02: {
    intro: "可视化与交互方向",
    color: "linear-gradient(135deg, #7c5cff, #f0abfc)",
  },
  demo_03: {
    intro: "硬件测试与产品探索",
    color: "linear-gradient(135deg, #18b7a7, #ffd166)",
  },
};

function DemoPage() {
  const [scenarios, setScenarios] = useState([]);
  const [selectedId, setSelectedId] = useState("");
  const [detail, setDetail] = useState(null);
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
        const response = await axios.get(`${API_BASE_URL}/api/demo/scenarios`);
        setScenarios(response.data);
      } catch (requestError) {
        setError("演示数据暂时没有加载成功，请稍后再试。");
      } finally {
        setLoadingList(false);
      }
    }

    loadScenarios();
  }, []);

  const scenario = detail?.scenario;
  const matchScore = scenario?.match_score || 0;

  const selectedStudent = useMemo(() => {
    return scenarios.find((item) => item.id === selectedId);
  }, [scenarios, selectedId]);

  async function handleSelectScenario(scenarioId) {
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
      setAppealTarget(response.data.scenario.alternative_job);
      setAppealReason(response.data.scenario.appeal_reason);
    } catch (requestError) {
      setError("AI 解释官正在忙碌，请稍后重新选择。");
    } finally {
      setLoadingDetail(false);
    }
  }

  function handleOpenAppeal() {
    setAppealPreview("");
    setShowAppealModal(true);
  }

  function handleSubmitAppeal(event) {
    event.preventDefault();

    if (!scenario) {
      return;
    }

    // 仅用于演示：根据表单内容即时生成一份报告预览。
    setAppealPreview(
      [
        `学生姓名：${scenario.name}`,
        `原推荐岗位：${scenario.recommended_job}`,
        `申诉目标岗位：${appealTarget || scenario.alternative_job}`,
        `补充说明摘要：${appealReason || "学生希望补充更多相关经历供复审参考。"}`,
        `匹配度变化：当前 ${scenario.match_score} 分，目标岗位 ${scenario.alt_match_score} 分`,
        "结语：建议人工复审",
      ].join("\n")
    );
  }

  function closeModal() {
    setShowGrowthModal(false);
    setShowAppealModal(false);
  }

  const meta = selectedId ? studentMeta[selectedId] : null;

  return (
    <main className="demo-page">
      <style>{styles}</style>

      <section className="hero">
        <div>
          <p className="eyebrow">Tencent Campus Hiring AI Demo</p>
          <h1>校园招聘 AI 定岗解释台</h1>
          <p className="subtitle">
            选择一个学生场景，查看岗位推荐依据、成长建议与申诉报告草稿。
          </p>
        </div>
      </section>

      {error && <div className="alert">{error}</div>}

      <section className="student-grid" aria-label="演示场景列表">
        {loadingList ? (
          <div className="empty-state">正在加载演示场景...</div>
        ) : (
          scenarios.map((s) => (
            <button
              className={`student-card ${selectedId === s.id ? "active" : ""}`}
              key={s.id}
              onClick={() => handleSelectScenario(s.id)}
              type="button"
            >
              <span
                className="student-avatar"
                style={{ background: studentMeta[s.id]?.color }}
              >
                {s.name ? s.name.slice(-1) : "?"}
              </span>
              <span className="student-name">{s.name}</span>
              <span className="student-intro">{studentMeta[s.id]?.intro}</span>
              <span className="student-job">{s.recommended_job}</span>
            </button>
          ))
        )}
      </section>

      <section className="result-area">
        {loadingDetail && <div className="empty-state">AI 正在生成解释...</div>}

        {!loadingDetail && !detail && (
          <div className="empty-state">
            点击上方任意学生卡片，查看完整推荐解释。
          </div>
        )}

        {!loadingDetail && detail && scenario && (
          <div className="result-card">
            <div className="result-top">
              <div
                className="score-ring"
                style={{
                  background: `conic-gradient(#5b7cfa ${matchScore * 3.6}deg, #f0f4ff 0deg)`,
                }}
              >
                <div className="score-inner">
                  <strong>{matchScore}</strong>
                  <span>匹配度</span>
                </div>
              </div>
              <div>
                <p className="eyebrow">Recommended Role</p>
                <h2>{scenario.recommended_job}</h2>
                <p className="detail-meta">
                  候选人：{scenario.name} · 备选方向：{scenario.alternative_job}
                </p>
              </div>
            </div>

            <div className="desc-block">
              <h3>推荐解释</h3>
              <p>{detail.explanation}</p>
            </div>

            <div className="action-bar">
              <button
                className="action-primary"
                onClick={() => setShowGrowthModal(true)}
                type="button"
              >
                我想换岗
              </button>
              <button
                className="action-secondary"
                onClick={handleOpenAppeal}
                type="button"
              >
                发起申诉
              </button>
            </div>

            {selectedStudent?.recommended_job && (
              <p className="detail-meta" style={{ marginTop: 18 }}>
                原匹配岗位：{selectedStudent.recommended_job}
              </p>
            )}
          </div>
        )}
      </section>

      {/* 成长建议弹窗 */}
      {showGrowthModal && detail && scenario && (
        <div className="modal-backdrop" onClick={closeModal} role="presentation">
          <div
            className="modal-card"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
          >
            <button className="modal-close" onClick={closeModal} type="button">
              &times;
            </button>

            <p className="eyebrow">Growth Advice</p>
            <h2>目标岗位：{scenario.alternative_job}</h2>

            <div className="score-compare">
              <span>当前匹配分：{scenario.match_score}</span>
              <span>目标匹配分：{scenario.alt_match_score}</span>
            </div>

            <div className="modal-block">
              <h3>主要差距</h3>
              <ul className="gap-list">
                {scenario.alt_gaps.map((gap) => (
                  <li key={gap}>{gap}</li>
                ))}
              </ul>
            </div>

            <div className="modal-block">
              <h3>成长建议</h3>
              <p className="pre-line">{detail.advice}</p>
            </div>
          </div>
        </div>
      )}

      {/* 申诉弹窗 */}
      {showAppealModal && detail && scenario && (
        <div className="modal-backdrop" onClick={closeModal} role="presentation">
          <div
            className="modal-card appeal-modal"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
          >
            <button className="modal-close" onClick={closeModal} type="button">
              &times;
            </button>

            <p className="eyebrow">Appeal Report</p>
            <h2>申诉报告</h2>

            <form onSubmit={handleSubmitAppeal}>
              <label>
                申诉目标岗位
                <input
                  type="text"
                  value={appealTarget}
                  onChange={(e) => setAppealTarget(e.target.value)}
                />
              </label>
              <label>
                补充说明
                <textarea
                  rows={4}
                  value={appealReason}
                  onChange={(e) => setAppealReason(e.target.value)}
                />
              </label>
              <button className="action-primary" type="submit">
                生成申诉报告预览
              </button>
            </form>

            {appealPreview && (
              <div className="appeal-preview">{appealPreview}</div>
            )}
          </div>
        </div>
      )}
    </main>
  );
}

const styles = `
  * {
    box-sizing: border-box;
  }

  .demo-page {
    min-height: 100vh;
    padding: 44px 24px 64px;
    color: #1f2a44;
    background:
      radial-gradient(circle at top left, rgba(91, 124, 250, 0.12), transparent 30%),
      linear-gradient(135deg, #f7f9ff 0%, #eef4ff 48%, #f8fbf7 100%);
    font-family: Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", "Microsoft YaHei", sans-serif;
  }

  .hero,
  .student-grid,
  .result-area,
  .alert {
    width: min(1120px, 100%);
    margin: 0 auto;
  }

  .hero {
    display: flex;
    align-items: flex-end;
    justify-content: space-between;
    margin-bottom: 26px;
  }

  .eyebrow {
    margin: 0 0 8px;
    color: #5b7cfa;
    font-size: 13px;
    font-weight: 700;
    letter-spacing: 0;
    text-transform: uppercase;
  }

  h1, h2, h3, p {
    margin-top: 0;
  }

  h1 {
    margin-bottom: 12px;
    font-size: clamp(34px, 5vw, 56px);
    line-height: 1.08;
    letter-spacing: 0;
  }

  .subtitle {
    max-width: 680px;
    margin-bottom: 0;
    color: #58657d;
    font-size: 17px;
    line-height: 1.7;
  }

  .alert {
    margin-bottom: 18px;
    padding: 14px 16px;
    border: 1px solid #ffe0c8;
    border-radius: 8px;
    background: #fff8f0;
    color: #b65500;
  }

  .student-grid {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 18px;
    margin-bottom: 22px;
  }

  .student-card {
    min-height: 180px;
    padding: 24px;
    border: 1px solid rgba(91, 124, 250, 0.12);
    border-radius: 12px;
    background: rgba(255, 255, 255, 0.9);
    box-shadow: 0 8px 30px rgba(29, 38, 61, 0.06);
    color: inherit;
    cursor: pointer;
    text-align: left;
    transition: transform 180ms ease, box-shadow 180ms ease, border-color 180ms ease;
  }

  .student-card:hover,
  .student-card.active {
    transform: translateY(-4px);
    border-color: rgba(91, 124, 250, 0.45);
    box-shadow: 0 18px 48px rgba(91, 124, 250, 0.16);
  }

  .student-avatar {
    display: grid;
    width: 54px;
    height: 54px;
    margin-bottom: 16px;
    place-items: center;
    border-radius: 50%;
    color: white;
    font-size: 22px;
    font-weight: 800;
  }

  .student-name,
  .student-intro,
  .student-job {
    display: block;
  }

  .student-name {
    margin-bottom: 4px;
    font-size: 22px;
    font-weight: 800;
  }

  .student-intro {
    margin-bottom: 8px;
    color: #5b7cfa;
    font-size: 13px;
    font-weight: 600;
  }

  .student-job {
    color: #58657d;
    font-size: 15px;
    line-height: 1.5;
  }

  .result-area {
    min-height: 280px;
  }

  .empty-state,
  .result-card {
    border: 1px solid rgba(91, 124, 250, 0.1);
    border-radius: 8px;
    background: rgba(255, 255, 255, 0.92);
    box-shadow: 0 8px 30px rgba(29, 38, 61, 0.06);
  }

  .empty-state {
    padding: 36px;
    color: #58657d;
    text-align: center;
  }

  .result-card {
    padding: 30px;
  }

  .result-top {
    display: grid;
    grid-template-columns: 132px 1fr;
    gap: 24px;
    align-items: center;
    padding-bottom: 24px;
    border-bottom: 1px solid #e7ecfb;
  }

  .score-ring {
    display: grid;
    width: 132px;
    height: 132px;
    place-items: center;
    border-radius: 50%;
  }

  .score-inner {
    display: grid;
    width: 104px;
    height: 104px;
    place-items: center;
    align-content: center;
    border-radius: 50%;
    background: white;
  }

  .score-inner strong {
    color: #5b7cfa;
    font-size: 42px;
    line-height: 1;
  }

  .score-inner span {
    margin-top: 6px;
    color: #58657d;
    font-size: 13px;
  }

  .result-top h2 {
    margin-bottom: 8px;
    font-size: 30px;
    line-height: 1.2;
  }

  .detail-meta {
    margin-bottom: 0;
    color: #58657d;
    line-height: 1.7;
  }

  .desc-block {
    padding: 26px 0 8px;
  }

  .desc-block h3 {
    margin-bottom: 12px;
    font-size: 18px;
  }

  .desc-block p {
    color: #40506a;
    font-size: 16px;
    line-height: 1.85;
    white-space: pre-line;
  }

  .action-bar {
    display: flex;
    flex-wrap: wrap;
    gap: 12px;
    margin-top: 18px;
  }

  .action-primary,
  .action-secondary,
  .modal-close {
    border: 0;
    cursor: pointer;
    font: inherit;
    transition: transform 160ms ease, box-shadow 160ms ease, background 160ms ease;
  }

  .action-primary,
  .action-secondary {
    min-width: 126px;
    padding: 12px 18px;
    border-radius: 8px;
    font-weight: 800;
  }

  .action-primary {
    background: #5b7cfa;
    color: white;
    box-shadow: 0 12px 24px rgba(91, 124, 250, 0.25);
  }

  .action-secondary {
    border: 1px solid #d9e1f2;
    background: white;
    color: #5b7cfa;
  }

  .action-primary:hover,
  .action-secondary:hover {
    transform: translateY(-2px);
  }

  .action-primary:hover {
    background: #4a64e0;
  }

  .action-secondary:hover {
    background: #f3f6ff;
  }

  .modal-backdrop {
    position: fixed;
    inset: 0;
    display: grid;
    z-index: 20;
    place-items: center;
    padding: 24px;
    background: rgba(8, 23, 44, 0.42);
    backdrop-filter: blur(8px);
  }

  .modal-card {
    position: relative;
    width: min(760px, 100%);
    max-height: min(82vh, 760px);
    overflow: auto;
    padding: 30px;
    border-radius: 8px;
    background: #ffffff;
    box-shadow: 0 30px 90px rgba(29, 38, 61, 0.26);
  }

  .modal-card h2 {
    margin: 0 0 18px;
    color: #1f2a44;
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
    line-height: 1;
  }

  .modal-close:hover {
    transform: rotate(8deg);
    background: #e8edfa;
  }

  .score-compare {
    display: flex;
    flex-wrap: wrap;
    gap: 10px;
    margin-bottom: 20px;
  }

  .score-compare span {
    padding: 9px 12px;
    border-radius: 8px;
    background: #f3f6ff;
    color: #4c5c78;
    font-weight: 800;
  }

  .modal-block {
    padding: 18px 0;
    border-top: 1px solid #e7ecfb;
  }

  .modal-block h3 {
    margin: 0 0 12px;
    color: #26324a;
  }

  .gap-list {
    display: grid;
    gap: 10px;
    margin: 0;
    padding: 0;
    list-style: none;
    color: #40506a;
    line-height: 1.7;
  }

  .pre-line {
    margin: 0;
    color: #40506a;
    line-height: 1.85;
    white-space: pre-line;
  }

  .appeal-modal form {
    display: grid;
    gap: 16px;
  }

  .appeal-modal label {
    display: grid;
    gap: 8px;
    color: #40506a;
    font-weight: 800;
  }

  .appeal-modal input,
  .appeal-modal textarea {
    width: 100%;
    border: 1px solid #d9e1f2;
    border-radius: 8px;
    padding: 12px 14px;
    color: #26324a;
    font: inherit;
    outline: none;
    transition: border-color 160ms ease, box-shadow 160ms ease;
  }

  .appeal-modal input:focus,
  .appeal-modal textarea:focus {
    border-color: #5b7cfa;
    box-shadow: 0 0 0 4px rgba(91, 124, 250, 0.12);
  }

  .appeal-preview {
    margin: 22px 0 0;
    padding: 18px 20px;
    border: 0;
    border-radius: 8px;
    background: #f3f5f9;
    color: #40506a;
    line-height: 1.8;
    white-space: pre-line;
  }

  @media (max-width: 840px) {
    .demo-page {
      padding: 34px 16px 56px;
    }

    .student-grid {
      grid-template-columns: 1fr;
    }

    .result-top {
      grid-template-columns: 1fr;
    }

    .result-card,
    .modal-card {
      padding: 22px;
    }
  }
`;

export default DemoPage;
