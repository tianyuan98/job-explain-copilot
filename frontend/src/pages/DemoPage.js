import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";

const API_BASE_URL = process.env.REACT_APP_API_URL || "http://localhost:8000/api/demo";

function DemoPage() {
  const [scenarios, setScenarios] = useState([]);
  const [selectedId, setSelectedId] = useState("");
  const [detail, setDetail] = useState(null);
  const [loadingScenarios, setLoadingScenarios] = useState(true);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [error, setError] = useState("");
  const [modalType, setModalType] = useState(null);

  useEffect(() => {
    async function fetchScenarios() {
      try {
        setLoadingScenarios(true);
        setError("");
        const response = await axios.get(`${API_BASE_URL}/scenarios`);
        setScenarios(response.data);
      } catch (err) {
        setError("场景列表加载失败，请确认后端服务已启动。");
      } finally {
        setLoadingScenarios(false);
      }
    }

    fetchScenarios();
  }, []);

  const selectedScenario = detail?.scenario;
  const score = selectedScenario?.match_score ?? 0;

  const initials = useMemo(() => {
    return scenarios.reduce((result, item) => {
      result[item.id] = item.name ? item.name.slice(-1) : "?";
      return result;
    }, {});
  }, [scenarios]);

  async function handleSelectScenario(scenarioId) {
    try {
      setSelectedId(scenarioId);
      setLoadingDetail(true);
      setError("");
      setModalType(null);
      const response = await axios.post(`${API_BASE_URL}/explain`, {
        scenario_id: scenarioId,
      });
      setDetail(response.data);
    } catch (err) {
      setError("解释内容生成失败，请稍后重试。");
    } finally {
      setLoadingDetail(false);
    }
  }

  function closeModal() {
    setModalType(null);
  }

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

      <section className="scenario-grid" aria-label="演示场景列表">
        {loadingScenarios ? (
          <div className="empty-state">正在加载演示场景...</div>
        ) : (
          scenarios.map((scenario) => (
            <button
              className={`scenario-card ${
                selectedId === scenario.id ? "active" : ""
              }`}
              key={scenario.id}
              onClick={() => handleSelectScenario(scenario.id)}
              type="button"
            >
              <span className="avatar">{initials[scenario.id]}</span>
              <span className="scenario-name">{scenario.name}</span>
              <span className="scenario-job">{scenario.recommended_job}</span>
            </button>
          ))
        )}
      </section>

      <section className="detail-area">
        {loadingDetail && <div className="empty-state">AI 正在生成解释...</div>}

        {!loadingDetail && !detail && (
          <div className="empty-state">
            点击上方任意学生卡片，查看完整推荐解释。
          </div>
        )}

        {!loadingDetail && detail && selectedScenario && (
          <div className="detail-card">
            <div className="score-panel">
              <div
                className="score-ring"
                style={{
                  background: `conic-gradient(#1677ff ${
                    score * 3.6
                  }deg, #e8f1ff 0deg)`,
                }}
              >
                <div className="score-inner">
                  <strong>{score}</strong>
                  <span>匹配度</span>
                </div>
              </div>
              <div>
                <p className="eyebrow">Recommended Role</p>
                <h2>{selectedScenario.recommended_job}</h2>
                <p className="detail-meta">
                  候选人：{selectedScenario.name} · 备选方向：
                  {selectedScenario.alternative_job}
                </p>
              </div>
            </div>

            <div className="explanation-block">
              <h3>推荐解释</h3>
              <p>{detail.explanation}</p>
            </div>

            <div className="action-row">
              <button
                className="primary-button"
                onClick={() => setModalType("advice")}
                type="button"
              >
                我想换岗
              </button>
              <button
                className="secondary-button"
                onClick={() => setModalType("appeal")}
                type="button"
              >
                发起申诉
              </button>
            </div>
          </div>
        )}
      </section>

      {modalType && detail && selectedScenario && (
        <div className="modal-backdrop" onClick={closeModal} role="presentation">
          <div
            className="modal"
            onClick={(event) => event.stopPropagation()}
            role="dialog"
            aria-modal="true"
          >
            <button className="close-button" onClick={closeModal} type="button">
              ×
            </button>

            {modalType === "advice" && (
              <>
                <p className="eyebrow">Growth Advice</p>
                <h2>目标岗位：{selectedScenario.alternative_job}</h2>
                <div className="modal-section">
                  <h3>主要差距</h3>
                  <ul>
                    {selectedScenario.alt_gaps.map((gap) => (
                      <li key={gap}>{gap}</li>
                    ))}
                  </ul>
                </div>
                <div className="modal-section">
                  <h3>成长建议</h3>
                  <p className="pre-line">{detail.advice}</p>
                </div>
              </>
            )}

            {modalType === "appeal" && (
              <>
                <p className="eyebrow">Appeal Report</p>
                <h2>申诉报告草稿</h2>
                <div className="modal-section">
                  <p className="pre-line">{detail.appeal_report}</p>
                </div>
              </>
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
    color: #172033;
    background:
      radial-gradient(circle at top left, rgba(22, 119, 255, 0.16), transparent 30%),
      linear-gradient(135deg, #f7fbff 0%, #eef6ff 48%, #f8fbf7 100%);
    font-family: Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", "Microsoft YaHei", sans-serif;
  }

  .hero,
  .scenario-grid,
  .detail-area,
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
    color: #1677ff;
    font-size: 13px;
    font-weight: 700;
    letter-spacing: 0;
    text-transform: uppercase;
  }

  h1,
  h2,
  h3,
  p {
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
    color: #526070;
    font-size: 17px;
    line-height: 1.7;
  }

  .alert {
    margin-bottom: 18px;
    padding: 14px 16px;
    border: 1px solid #ffd8bf;
    border-radius: 8px;
    background: #fff7ed;
    color: #a34500;
  }

  .scenario-grid {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 18px;
    margin-bottom: 22px;
  }

  .scenario-card {
    min-height: 170px;
    padding: 24px;
    border: 1px solid rgba(22, 119, 255, 0.12);
    border-radius: 8px;
    background: rgba(255, 255, 255, 0.88);
    box-shadow: 0 18px 45px rgba(27, 84, 140, 0.1);
    color: inherit;
    cursor: pointer;
    text-align: left;
    transition: transform 180ms ease, box-shadow 180ms ease, border-color 180ms ease;
  }

  .scenario-card:hover,
  .scenario-card.active {
    transform: translateY(-4px);
    border-color: rgba(22, 119, 255, 0.42);
    box-shadow: 0 24px 58px rgba(22, 119, 255, 0.18);
  }

  .avatar {
    display: grid;
    width: 54px;
    height: 54px;
    margin-bottom: 18px;
    place-items: center;
    border-radius: 50%;
    background: linear-gradient(135deg, #1677ff, #13c2c2);
    color: white;
    font-size: 22px;
    font-weight: 800;
  }

  .scenario-name,
  .scenario-job {
    display: block;
  }

  .scenario-name {
    margin-bottom: 8px;
    font-size: 22px;
    font-weight: 800;
  }

  .scenario-job {
    color: #526070;
    font-size: 15px;
    line-height: 1.5;
  }

  .detail-area {
    min-height: 280px;
  }

  .empty-state,
  .detail-card {
    border: 1px solid rgba(22, 119, 255, 0.12);
    border-radius: 8px;
    background: rgba(255, 255, 255, 0.9);
    box-shadow: 0 18px 45px rgba(27, 84, 140, 0.1);
  }

  .empty-state {
    padding: 36px;
    color: #687789;
    text-align: center;
  }

  .detail-card {
    padding: 30px;
  }

  .score-panel {
    display: grid;
    grid-template-columns: 132px 1fr;
    gap: 24px;
    align-items: center;
    padding-bottom: 24px;
    border-bottom: 1px solid #e7eef7;
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
    color: #1677ff;
    font-size: 42px;
    line-height: 1;
  }

  .score-inner span {
    margin-top: 6px;
    color: #687789;
    font-size: 13px;
  }

  .score-panel h2 {
    margin-bottom: 8px;
    font-size: 30px;
    line-height: 1.2;
  }

  .detail-meta {
    margin-bottom: 0;
    color: #687789;
    line-height: 1.7;
  }

  .explanation-block {
    padding: 26px 0 8px;
  }

  .explanation-block h3,
  .modal-section h3 {
    margin-bottom: 12px;
    font-size: 18px;
  }

  .explanation-block p,
  .pre-line {
    color: #334155;
    font-size: 16px;
    line-height: 1.85;
    white-space: pre-line;
  }

  .action-row {
    display: flex;
    flex-wrap: wrap;
    gap: 12px;
    margin-top: 18px;
  }

  .primary-button,
  .secondary-button,
  .close-button {
    border: 0;
    cursor: pointer;
    font: inherit;
    transition: transform 160ms ease, box-shadow 160ms ease, background 160ms ease;
  }

  .primary-button,
  .secondary-button {
    min-width: 126px;
    padding: 12px 18px;
    border-radius: 8px;
    font-weight: 800;
  }

  .primary-button {
    background: #1677ff;
    color: white;
    box-shadow: 0 12px 24px rgba(22, 119, 255, 0.25);
  }

  .secondary-button {
    border: 1px solid #cfe0f5;
    background: white;
    color: #1677ff;
  }

  .primary-button:hover,
  .secondary-button:hover,
  .close-button:hover {
    transform: translateY(-2px);
  }

  .primary-button:hover {
    background: #0958d9;
  }

  .secondary-button:hover {
    background: #edf6ff;
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

  .modal {
    position: relative;
    width: min(760px, 100%);
    max-height: min(760px, 88vh);
    overflow: auto;
    padding: 30px;
    border-radius: 8px;
    background: white;
    box-shadow: 0 30px 80px rgba(8, 23, 44, 0.28);
  }

  .modal h2 {
    margin-bottom: 20px;
    font-size: 26px;
  }

  .modal-section {
    padding: 18px 0;
    border-top: 1px solid #e7eef7;
  }

  .modal-section ul {
    margin: 0;
    padding-left: 20px;
    color: #334155;
    line-height: 1.8;
  }

  .close-button {
    position: absolute;
    top: 18px;
    right: 18px;
    width: 36px;
    height: 36px;
    border-radius: 50%;
    background: #f1f5f9;
    color: #334155;
    font-size: 24px;
    line-height: 1;
  }

  @media (max-width: 820px) {
    .demo-page {
      padding: 30px 16px 48px;
    }

    .scenario-grid {
      grid-template-columns: 1fr;
    }

    .score-panel {
      grid-template-columns: 1fr;
    }

    .score-panel h2 {
      font-size: 25px;
    }

    .detail-card,
    .modal {
      padding: 22px;
    }
  }
`;

export default DemoPage;
