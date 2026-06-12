import React, { useMemo, useRef, useState } from "react";
import axios from "axios";

const API_BASE_URL = "https://job-explain-copilot-production.up.railway.app";

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
  const [appealStep, setAppealStep] = useState("form");
  const [appealNegotiationText, setAppealNegotiationText] = useState("");
  const [appealSupplement, setAppealSupplement] = useState("");
  const [appealGenerating, setAppealGenerating] = useState(false);
  const [resumeFileName, setResumeFileName] = useState("");
  const [parsing, setParsing] = useState(false);
  const [parseStage, setParseStage] = useState("");
  const [parseError, setParseError] = useState("");
  const [generatedPortrait, setGeneratedPortrait] = useState("");
  const [portraitDimensions, setPortraitDimensions] = useState([]);
  const [disputeMode, setDisputeMode] = useState(false);
  const [disputedDimensions, setDisputedDimensions] = useState([]);
  const [disputeReason, setDisputeReason] = useState("这个评价偏低了");
  const [disputeDetail, setDisputeDetail] = useState("");
  const [disputeMessage, setDisputeMessage] = useState("");
  const [activeRadarTip, setActiveRadarTip] = useState(null);
  const [generatingPortrait, setGeneratingPortrait] = useState(false);
  const [generatedRecommendation, setGeneratedRecommendation] = useState(null);
  const [generatingRecommendation, setGeneratingRecommendation] = useState(false);

  const fileInputRef = useRef(null);

  const scenario = detail?.scenario;
  const archive = detail?.archive || scenario?.archive || [];
  const portrait = detail?.portrait || scenario?.portrait || generatedPortrait || "";
  const matchScore = scenario?.match_score || generatedRecommendation?.match_score || 0;

  // 统一推荐数据源：demo模式用 scenario，手动模式用 generatedRecommendation
  const recommendation = scenario?.recommended_job
    ? {
        recommended_job: scenario.recommended_job,
        match_score: scenario.match_score,
        key_reasons: scenario.key_reasons || [],
        alternative_job: scenario.alternative_job,
        alt_match_score: scenario.alt_match_score,
        alt_gaps: scenario.alt_gaps || [],
        alt_suggestions: scenario.alt_suggestions || [],
        explanation: detail?.explanation || "",
        advice: detail?.advice || "",
        name: scenario.name,
      }
    : generatedRecommendation
      ? {
          recommended_job: generatedRecommendation.recommended_job,
          match_score: generatedRecommendation.match_score,
          key_reasons: generatedRecommendation.key_reasons || [],
          alternative_job: generatedRecommendation.alternative_job,
          alt_match_score: generatedRecommendation.alt_match_score,
          alt_gaps: generatedRecommendation.alt_gaps || [],
          alt_suggestions: generatedRecommendation.alt_suggestions || [],
          explanation: "",
          advice: "",
          name: extractField("姓名"),
        }
      : null;

  const abilityCards = useMemo(() => parsePortrait(portrait), [portrait]);
  const radarDimensions = useMemo(
    () => normalizeRadarDimensions(detail?.dimensions || scenario?.dimensions || portraitDimensions, abilityCards),
    [detail?.dimensions, scenario?.dimensions, portraitDimensions, abilityCards]
  );

  async function handleStartMatching() {
    // 情况 A：示例数据模式 → 已有推荐数据，直接进入步骤4
    if (scenario?.recommended_job) {
      setCurrentStep(4);
      return;
    }

    // 情况 B：手动模式 → 调用 API 生成推荐
    setGeneratingRecommendation(true);
    try {
      const payload = {
        name: extractField("姓名"),
        school: extractField("学校"),
        major: extractField("专业"),
        degree: extractField("学历"),
        algorithm_rank: extractField("算法笔试排名"),
        internship: extractField("实习经历"),
        projects: extractField("项目经历"),
        certificates: extractField("证书/补充") || extractField("补充信息"),
        career_interest: extractField("职业意向"),
        portrait: portrait,
        portrait_dispute: buildPortraitDisputeText(disputedDimensions, disputeReason, disputeDetail),
      };
      const response = await axios.post(`${API_BASE_URL}/api/demo/generate_recommendation`, payload);
      if (response.data?.error) {
        setError(response.data.message || "岗位推荐生成失败，请重试");
      } else {
        setGeneratedRecommendation(response.data);
        setCurrentStep(4);
      }
    } catch (e) {
      setError("岗位推荐生成失败，请重试");
    } finally {
      setGeneratingRecommendation(false);
    }
  }

  function extractField(label) {
    const found = formFields.find((f) => f.label === label);
    return found?.value || "";
  }

  async function handleGeneratePortrait() {
    // 情况 A：已有预置 portrait（来自一键导入示例数据）
    if (detail?.portrait || scenario?.portrait) {
      setPortraitDimensions(detail?.dimensions || scenario?.dimensions || []);
      setDisputeMode(false);
      setDisputeMessage("");
      setActiveRadarTip(null);
      setCurrentStep(3);
      return;
    }

    // 情况 B：手动填写模式 → 调用 API 生成
    setGeneratingPortrait(true);
    try {
      const response = await axios.post(`${API_BASE_URL}/api/demo/generate_portrait`, {
        school: extractField("学校"),
        major: extractField("专业"),
        degree: extractField("学历"),
        algorithm_rank: extractField("算法笔试排名"),
        internship: extractField("实习经历"),
        projects: extractField("项目经历"),
        certificates: extractField("证书/补充") || extractField("补充信息"),
        career_interest: extractField("职业意向"),
      });
      setGeneratedPortrait(response.data.portrait || "");
      setPortraitDimensions(response.data.dimensions || []);
      setDisputeMode(false);
      setDisputedDimensions([]);
      setDisputeMessage("");
      setActiveRadarTip(null);
      setCurrentStep(3);
    } catch (e) {
      setError("画像生成失败，请检查网络后重试");
    } finally {
      setGeneratingPortrait(false);
    }
  }

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
      setPortraitDimensions(fullDetail.dimensions || fullDetail.scenario?.dimensions || []);
      setFormFields(buildFields(fullDetail));
      setAppealTarget(fullDetail.scenario.alternative_job || "");
      setAppealReason(fullDetail.scenario.appeal_reason || "");
      setAppealReport(fullDetail.appeal_report || "");
      setAppealNegotiationText("");
      setAppealSupplement("");
      setAppealStep("form");
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
    if (!file) return;

    setResumeFileName(file.name);
    setParseError("");
    setParsing(true);

    // 进度动画阶段
    const stages = [
      "正在提取简历内容…",
      "正在识别教育背景…",
      "正在分析技能标签…",
    ];
    let stageIndex = 0;
    setParseStage(stages[0]);
    const stageTimer = setInterval(() => {
      stageIndex++;
      if (stageIndex < stages.length) {
        setParseStage(stages[stageIndex]);
      }
    }, 1200);

    const formData = new FormData();
    formData.append("file", file);

    axios
      .post(`${API_BASE_URL}/api/demo/parse_resume`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      })
      .then((response) => {
        clearInterval(stageTimer);
        setParseStage("");
        setParsing(false);
        if (response.data?.error) {
          // 解析失败：只显示错误提示，不标记上传成功
          setParseError(response.data.message || "简历解析失败，请手动填写基本信息");
          setResumeFileName(file.name);
        } else {
          // 解析成功：清除错误、标记上传成功、预填表单
          setParseError("");
          setResumeUploaded(true);
          setFormFields(parsedToFields(response.data));
        }
      })
      .catch(() => {
        clearInterval(stageTimer);
        setParseStage("");
        setParsing(false);
        // 网络错误：只显示错误，不标记上传成功
        setParseError("简历解析失败，请手动填写基本信息");
        setFormFields(defaultResumeFields(file.name));
      });

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

  function handleDisputeButton() {
    if (disputeMode) {
      if (disputedDimensions.length === 0) {
        setDisputeMessage("请先选择至少一个不准确的能力项。");
        return;
      }
      setDisputeMode(false);
      setDisputeMessage("已记录，我们将在后续优化中参考。");
      return;
    }
    setDisputeMode(true);
    setDisputeMessage("请选择你觉得不准确的能力项。");
  }

  function handleAbilityDispute(label) {
    if (!disputeMode) return;
    setDisputedDimensions((current) =>
      current.includes(label)
        ? current.filter((item) => item !== label)
        : [...current, label]
    );
  }

  function clearPortraitDispute() {
    setDisputedDimensions([]);
    setDisputeReason("这个评价偏低了");
    setDisputeDetail("");
    setDisputeMessage("");
  }

  function buildAppealPayload() {
    return {
      name: recommendation?.name || "",
      original_job: recommendation?.recommended_job || "",
      target_job: appealTarget || recommendation?.alternative_job || "",
      reason: appealReason,
      orig_score: recommendation?.match_score || 0,
      target_score: recommendation?.alt_match_score || 0,
    };
  }

  function buildAppealNegotiation(payload) {
    const gap = Math.abs((payload.orig_score || 0) - (payload.target_score || 0));
    return `AI 已分析你的申诉，你的意向岗位「${payload.target_job || "目标岗位"}」与当前推荐岗位「${payload.original_job || "原推荐岗位"}」匹配度差距为 ${gap} 分。若你有新的项目、证书、作品集或面试表现材料，可以继续申诉并进入人工复核；若暂无补充材料，也可以先保留当前推荐结果。是否坚持申诉？`;
  }

  function buildLocalAppealReport(payload) {
    return [
      "【学生申诉结构化报告】",
      "",
      "一、学生基本信息",
      `- 学生姓名：${payload.name || "未填写"}`,
      "",
      "二、原推荐岗位信息",
      `- 原推荐岗位：${payload.original_job || "未填写"}`,
      "",
      "三、申诉目标岗位信息",
      `- 申诉目标岗位：${payload.target_job || "未填写"}`,
      "",
      "四、补充说明摘要",
      `- ${payload.reason || "学生希望补充更多材料供 HR 复审。"}`,
      "",
      "五、岗位匹配度变化",
      `- 原岗位匹配分：${payload.orig_score}`,
      `- 目标岗位匹配分：${payload.target_score}`,
      "",
      "六、结语",
      "- 建议人工复审",
    ].join("\n");
  }

  function openAppealModal() {
    if (appealReport) {
      const payload = buildAppealPayload();
      setAppealNegotiationText((current) => current || buildAppealNegotiation(payload));
      setAppealStep("negotiate");
    } else {
      setAppealStep("form");
    }
    setShowAppealModal(true);
  }

  function resetAppealFlow({ close = true } = {}) {
    setAppealStep("form");
    setAppealNegotiationText("");
    setAppealSupplement("");
    setAppealGenerating(false);
    if (!detail?.appeal_report && !scenario?.appeal_report) {
      setAppealReport("");
    }
    if (close) {
      setShowAppealModal(false);
    }
  }

  async function handleAppealSubmit(event) {
    event.preventDefault();

    if (!recommendation) {
      return;
    }

    const payload = buildAppealPayload();
    setAppealGenerating(true);

    try {
      const response = await axios.post(`${API_BASE_URL}/api/demo/generate_appeal_report`, payload);
      setAppealReport(response.data?.report || buildLocalAppealReport(payload));
      setAppealNegotiationText(response.data?.negotiation || buildAppealNegotiation(payload));
      setAppealStep("negotiate");
    } catch (e) {
      setError("申诉报告生成失败，请重试");
      setAppealReport(buildLocalAppealReport(payload));
      setAppealNegotiationText(buildAppealNegotiation(payload));
      setAppealStep("negotiate");
    } finally {
      setAppealGenerating(false);
    }
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
              className={`upload-zone ${resumeUploaded ? "uploaded" : ""} ${parsing ? "parsing" : ""}`}
              onClick={handleUploadClick}
              type="button"
              disabled={parsing}
            >
              {parsing ? (
                <>
                  <strong>{resumeFileName}</strong>
                  <span className="parse-progress">{parseStage}</span>
                </>
              ) : resumeUploaded ? (
                <>
                  <strong>{resumeFileName || (scenario ? `${scenario.name}_简历.pdf ✓` : "简历.pdf ✓")}</strong>
                  <span>已解析出关键字段</span>
                </>
              ) : (
                <>
                  <strong>点击或拖拽文件到这里</strong>
                  <span>支持 PDF（解析后自动填充表单）</span>
                </>
              )}
            </button>

            {parseError && <div className="soft-alert">{parseError}</div>}

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
                onClick={handleGeneratePortrait}
                type="button"
                disabled={generatingPortrait}
              >
                {generatingPortrait ? "生成中…" : "确认并生成能力画像 →"}
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
              <AbilityRadar
                activeIndex={activeRadarTip}
                dimensions={radarDimensions}
                onToggleTip={(index) => setActiveRadarTip(activeRadarTip === index ? null : index)}
              />

              <h3 className="grid-section-title">能力维度概览（点击"我觉得不准"可反馈异议）</h3>
              <div className="ability-grid">
                {abilityCards.map((item) => (
                  <button
                    className={`ability-item ${disputeMode ? "disputable" : ""} ${
                      disputedDimensions.includes(item.label) ? "disputed" : ""
                    }`}
                    disabled={!disputeMode}
                    key={item.label}
                    onClick={() => handleAbilityDispute(item.label)}
                    type="button"
                  >
                    <span className={`ability-badge ${item.tone}`}>{item.level}</span>
                    <strong>{item.label}</strong>
                    <p>{item.detail}</p>
                  </button>
                ))}
              </div>

              <div className="portrait-feedback">
                <button
                  className={`dispute-btn ${disputeMode ? "active" : ""}`}
                  onClick={handleDisputeButton}
                  type="button"
                >
                  {disputeMode ? "完成标记" : "我觉得不准"}
                </button>
                {disputedDimensions.length > 0 && !disputeMode && (
                  <button className="dispute-clear" onClick={clearPortraitDispute} type="button">
                    清空异议
                  </button>
                )}
                {disputeMessage && <span>{disputeMessage}</span>}
              </div>

              {(disputeMode || disputedDimensions.length > 0) && (
                <div className="dispute-panel">
                  <div className="dispute-summary">
                    <strong>已选择</strong>
                    <span>
                      {disputedDimensions.length > 0 ? disputedDimensions.join("、") : "请点击上方能力卡片"}
                    </span>
                  </div>
                  <label>
                    异议原因
                    <select
                      onChange={(event) => setDisputeReason(event.target.value)}
                      value={disputeReason}
                    >
                      <option value="这个评价偏低了">这个评价偏低了</option>
                      <option value="这个维度不相关">这个维度不相关</option>
                      <option value="我有补充项目/证书/经历">我有补充项目/证书/经历</option>
                      <option value="依据不完整">依据不完整</option>
                    </select>
                  </label>
                  <label>
                    补充说明
                    <textarea
                      onChange={(event) => setDisputeDetail(event.target.value)}
                      placeholder="可以补充项目、证书、作品集或你认为画像不准确的原因"
                      rows="3"
                      value={disputeDetail}
                    />
                  </label>
                  {disputedDimensions.length > 0 && !disputeMode && (
                    <p className="dispute-note">
                      进入岗位匹配时，这条异议会作为补充信号传给推荐模型，并建议后续复核。
                    </p>
                  )}
                </div>
              )}

              <div className="dimension-details">
                {abilityCards.map((item) => (
                  <div className="dimension-card" key={item.label}>
                    <div className="dim-card-header">
                      <strong>{item.label}</strong>
                      <span className={`ability-badge ${item.tone}`}>{item.level}</span>
                    </div>
                    <p>{item.detail}</p>
                  </div>
                ))}
              </div>
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
                onClick={handleStartMatching}
                type="button"
                disabled={generatingRecommendation}
              >
                {generatingRecommendation ? "正在分析并生成岗位推荐…" : "开始岗位匹配 →"}
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

            {recommendation ? (
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
                    <h2>{recommendation.recommended_job}</h2>
                    {recommendation.explanation && <p>{recommendation.explanation}</p>}
                  </div>
                </div>

                <ul className="reason-list">
                  {recommendation.key_reasons.map((reason) => (
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
                    onClick={openAppealModal}
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

      {showExploreModal && recommendation && (
        <Modal title="探索其他可能岗位" onClose={() => setShowExploreModal(false)}>
          <p className="eyebrow">目标岗位</p>
          <h3 className="modal-job">{recommendation.alternative_job}</h3>
          <div className="score-pills">
            <span>匹配度 {recommendation.alt_match_score}</span>
            <span>当前推荐 {recommendation.match_score}</span>
          </div>

          {Number.isFinite(Number(recommendation.alt_match_score)) && recommendation.alt_gaps?.length > 0 && (
            <div className="growth-progress">
              <div className="growth-progress-top">
                <strong>岗位匹配提升进度</strong>
                <span>{recommendation.alt_match_score}/100</span>
              </div>
              <div className="growth-progress-track" aria-label="岗位匹配提升进度">
                <div
                  className="growth-progress-fill"
                  style={{ width: `${Math.min(100, Math.max(0, Number(recommendation.alt_match_score)))}%` }}
                />
              </div>
              <p>每完成一项补给，预计可提升 {getGrowthStepScore(recommendation)} 分</p>
            </div>
          )}

          <div className="modal-block">
            <h4>成长向导</h4>
            {recommendation.alt_gaps?.length > 0 ? (
              <div className="growth-guide-list">
                {buildGrowthItems(recommendation).map((item) => (
                  <div className="growth-guide-item" key={item.gap}>
                    <p>❌ {item.gap}</p>
                    <span className="growth-supply-tag">💡 {item.suggestion}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="pre-line">暂未识别到明确差距，建议补充更多项目、课程或作品集信息后再评估。</p>
            )}
          </div>
          <button className="primary-btn wide" type="button">
            发起岗位复审
          </button>
        </Modal>
      )}

      {showAppealModal && recommendation && (
        <Modal title="申诉助手" onClose={() => resetAppealFlow()}>
          <AppealSteps current={appealStep} />

          {appealStep === "form" && (
            <form className="appeal-form" onSubmit={handleAppealSubmit}>
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
              <button className="primary-btn" disabled={appealGenerating} type="submit">
                {appealGenerating ? "生成中…" : "生成申诉报告"}
              </button>
            </form>
          )}

          {appealStep === "negotiate" && (
            <>
              <div className="appeal-negotiate">
                <strong>AI 协商建议</strong>
                <p>{appealNegotiationText}</p>
              </div>
              <blockquote className="appeal-preview">{appealReport}</blockquote>
              <div className="appeal-actions">
                <button
                  className="primary-btn"
                  onClick={() => setAppealStep("supplement")}
                  type="button"
                >
                  坚持申诉 →
                </button>
                <button className="ghost-btn" onClick={() => resetAppealFlow()} type="button">
                  放弃申诉
                </button>
              </div>
            </>
          )}

          {appealStep === "supplement" && (
            <div className="appeal-stage">
              <p className="appeal-status">请补充更多证明材料，将转交部门面试官复核。</p>
              <label>
                补充材料说明
                <textarea
                  onChange={(event) => setAppealSupplement(event.target.value)}
                  placeholder="例如：新增项目链接、竞赛证书、作品集、课程成绩或面试表现说明"
                  rows="5"
                  value={appealSupplement}
                />
              </label>
              <div className="appeal-upload-placeholder">
                文件上传占位（演示）：作品集、证书、项目截图等
              </div>
              <button
                className="primary-btn wide"
                onClick={() => setAppealStep("committee")}
                type="button"
              >
                提交补充材料并转人工
              </button>
            </div>
          )}

          {appealStep === "committee" && (
            <div className="appeal-stage">
              <p className="appeal-status muted">已转交部门面试官复核（演示）</p>
              <p className="appeal-status">部门无法裁决，将提交校招委员会集体审视。</p>
              <blockquote className="appeal-preview">{appealReport}</blockquote>
              <button
                className="primary-btn wide"
                onClick={() => setAppealStep("done")}
                type="button"
              >
                确认提交
              </button>
              <p className="appeal-status muted">已提交至校招委员会（演示）</p>
            </div>
          )}

          {appealStep === "done" && (
            <div className="appeal-stage done">
              <p className="appeal-status">你的申诉已被记录，我们将在 5 个工作日内反馈结果。</p>
              <button className="primary-btn wide" onClick={() => resetAppealFlow()} type="button">
                关闭
              </button>
            </div>
          )}
        </Modal>
      )}
    </main>
  );
}

function defaultResumeFields(fileName) {
  const inferredName = fileName ? fileName.replace(/[._].*/, "") : "示例学生";
  return [
    { key: "name", label: "姓名", value: inferredName, source: "来自简历", editable: true },
    { key: "school", label: "学校", value: "腾讯校园招聘候选人", source: "学生填写", editable: true },
    { key: "major", label: "专业", value: "", source: "学生填写", editable: true },
    { key: "degree", label: "学历", value: "", source: "学生填写", editable: true },
    { key: "project", label: "项目经历", value: "", source: "来自简历", editable: true },
    { key: "extra", label: "补充信息", value: "", source: "学生补充", editable: true },
  ];
}

function parsedToFields(parsed) {
  const clean = (val) => {
    if (!val) return "";
    const v = String(val).trim();
    if (v === "未识别" || v === "未知" || v === "无" || v === "undefined" || v === "null") return "";
    return v;
  };
  return [
    { key: "name", label: "姓名", value: clean(parsed.name), source: "来自简历", editable: true },
    { key: "school", label: "学校", value: clean(parsed.school), source: "来自简历", editable: true },
    { key: "major", label: "专业", value: clean(parsed.major), source: "来自简历", editable: true },
    { key: "degree", label: "学历", value: clean(parsed.degree), source: "来自简历", editable: true },
    { key: "internship", label: "实习经历", value: clean(parsed.internship), source: "来自简历", editable: true },
    { key: "project", label: "项目经历", value: clean(parsed.projects), source: "来自简历", editable: true },
    { key: "cert", label: "证书/补充", value: clean(parsed.certificates), source: "来自简历", editable: true },
    { key: "career_interest", label: "职业意向", value: clean(parsed.career_interest), source: "来自简历", editable: true },
  ];
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

  const archiveLabels = new Set(archive.map((a) => a.label));

  // 从 archive 中提取特定条目
  const certItem = archive.find((a) => a.label === "证书/补充");

  return [
    // 姓名：不在 archive 中，单独从 scenario 填入
    ...(archiveLabels.has("姓名") ? [] : [{
      key: "name",
      label: "姓名",
      value: scenario.name || "",
      source: "学生填写",
      editable: true,
    }]),
    // archive 所有条目，一一对应展示（去重基础字段）
    ...archiveFields,
    // 项目经历：archive 没有再补充
    ...(archiveLabels.has("项目经历") ? [] : [{
      key: "project",
      label: "项目经历",
      value: scenario.profile?.internship || "",
      source: "来自简历",
      editable: true,
    }]),
    // 补充信息：用 archive 的证书/补充，不用 appeal_reason
    {
      key: "extra",
      label: "补充信息",
      value: certItem?.value || "",
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

function buildPortraitDisputeText(dimensions, reason, detail) {
  if (!Array.isArray(dimensions) || dimensions.length === 0) return "";
  return [
    `异议维度：${dimensions.join("、")}`,
    `异议原因：${reason || "未填写"}`,
    `补充说明：${detail?.trim() || "用户未补充具体说明"}`,
  ].join("\n");
}

function getGrowthSuggestions(recommendation) {
  if (recommendation?.alt_suggestions?.length) {
    return recommendation.alt_suggestions;
  }

  const advice = recommendation?.advice || "";
  const sections = advice
    .split(/\n(?=\d+\.\s*\*\*|\d+\.\s)/)
    .map((item) => item.replace(/^\d+\.\s*/, "").replace(/\*\*/g, "").trim())
    .filter(Boolean);

  if (sections.length) {
    return sections;
  }

  return [
    "建议补充一个可展示的项目案例",
    "建议补充相关课程、竞赛或证书材料",
    "建议整理作品集或经历说明，便于人工复核",
  ];
}

function buildGrowthItems(recommendation) {
  const gaps = recommendation?.alt_gaps || [];
  const suggestions = getGrowthSuggestions(recommendation);
  return gaps.map((gap, index) => ({
    gap,
    suggestion: suggestions[index] || suggestions[index % suggestions.length] || "建议补充更多证明材料",
  }));
}

function getGrowthStepScore(recommendation) {
  const score = Number(recommendation?.alt_match_score);
  const gapCount = recommendation?.alt_gaps?.length || 0;
  if (!Number.isFinite(score) || gapCount === 0) return "";
  return Math.max(1, Math.round((100 - score) / gapCount));
}

function normalizeRadarDimensions(dimensions, abilityCards) {
  const source = Array.isArray(dimensions) && dimensions.length
    ? dimensions
    : abilityCards.map((item) => ({
        name: item.label,
        level: item.level,
        confidence: "低",
        evidence: item.detail || "来自能力画像文本解析",
      }));

  const normalized = source
    .filter((item) => item && (item.name || item.label))
    .slice(0, 5)
    .map((item) => ({
      name: String(item.name || item.label).trim(),
      level: normalizeRadarLevel(item.level),
      confidence: normalizeConfidence(item.confidence),
      evidence: String(item.evidence || item.detail || "暂无补充依据").trim(),
    }));

  if (normalized.length >= 3) return normalized;

  return [
    { name: "专业基础", level: "待补充", confidence: "低", evidence: "等待资料补充" },
    { name: "实践能力", level: "待补充", confidence: "低", evidence: "等待资料补充" },
    { name: "学习背景", level: "待补充", confidence: "低", evidence: "等待资料补充" },
    { name: "沟通协作", level: "待补充", confidence: "低", evidence: "等待资料补充" },
  ];
}

function normalizeRadarLevel(level) {
  const value = String(level || "").trim();
  if (value === "较强") return "较强";
  if (value === "一般" || value === "中等" || value === "待确认" || value === "已识别") return "一般";
  if (value.includes("强")) return "较强";
  if (value.includes("待") || value.includes("弱") || value.includes("不足")) return "待补充";
  return "待补充";
}

function normalizeConfidence(confidence) {
  const value = String(confidence || "").trim();
  if (value === "高" || value === "中" || value === "低") return value;
  if (value.includes("高")) return "高";
  if (value.includes("中")) return "中";
  return "低";
}

function levelScore(level) {
  if (level === "较强") return 3;
  if (level === "一般" || level === "中等") return 2;
  return 1;
}

function radarPoint(index, total, radius, center) {
  const angle = -Math.PI / 2 + (index * 2 * Math.PI) / total;
  return {
    x: center + Math.cos(angle) * radius,
    y: center + Math.sin(angle) * radius,
  };
}

function pointList(points) {
  return points.map((point) => `${point.x},${point.y}`).join(" ");
}

function AbilityRadar({ dimensions, activeIndex, onToggleTip }) {
  const size = 330;
  const center = size / 2;
  const maxRadius = 98;
  const items = normalizeRadarDimensions(dimensions, []).slice(0, 5);
  const total = items.length;
  const rings = [1, 2, 3];
  const axisPoints = items.map((_, index) => radarPoint(index, total, maxRadius, center));
  const valuePoints = items.map((item, index) =>
    radarPoint(index, total, (maxRadius * levelScore(item.level)) / 3, center)
  );
  const activeItem = activeIndex !== null ? items[activeIndex] : null;

  return (
    <section className="radar-panel" aria-label="能力雷达图">
      <div className="radar-copy">
        <p className="eyebrow">能力概览</p>
        <h2>维度雷达图</h2>
        <div className="radar-legend">
          <span><i className="legend-low" />待补充</span>
          <span><i className="legend-mid" />一般</span>
          <span><i className="legend-high" />较强</span>
        </div>
      </div>

      <div className="radar-stage">
        <svg className="radar-svg" viewBox={`0 0 ${size} ${size}`} role="img" aria-label="能力维度雷达图">
          {rings.map((ring) => {
            const radius = (maxRadius * ring) / 3;
            const points = items.map((_, index) => radarPoint(index, total, radius, center));
            return (
              <polygon
                className="radar-ring"
                key={ring}
                points={pointList(points)}
              />
            );
          })}

          {axisPoints.map((point, index) => (
            <line
              className="radar-axis"
              key={`axis-${items[index].name}`}
              x1={center}
              x2={point.x}
              y1={center}
              y2={point.y}
            />
          ))}

          <polygon className="radar-value" points={pointList(valuePoints)} />

          {items.map((item, index) => {
            const point = valuePoints[index];
            const labelPoint = radarPoint(index, total, maxRadius + 38, center);
            const anchor = labelPoint.x < center - 12 ? "end" : labelPoint.x > center + 12 ? "start" : "middle";
            return (
              <g key={item.name}>
                <circle
                  className="radar-hit"
                  onClick={() => onToggleTip(index)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") onToggleTip(index);
                  }}
                  cx={point.x}
                  cy={point.y}
                  r="14"
                  role="button"
                  tabIndex="0"
                  aria-label={`查看${item.name}依据`}
                />
                <circle
                  className={`radar-dot ${item.level === "较强" ? "dot-high" : item.level === "一般" ? "dot-mid" : "dot-low"}`}
                  cx={point.x}
                  cy={point.y}
                  r="5"
                />
                <text className="radar-label" textAnchor={anchor} x={labelPoint.x} y={labelPoint.y - 4}>
                  {item.name}
                </text>
                <text className="radar-level" textAnchor={anchor} x={labelPoint.x} y={labelPoint.y + 14}>
                  {item.level}
                </text>
                <foreignObject x={labelPoint.x - 13} y={labelPoint.y + 18} width="26" height="26">
                  <button
                    className="radar-info"
                    onClick={() => onToggleTip(index)}
                    type="button"
                    aria-label={`查看${item.name}置信度`}
                  >
                    ℹ️
                  </button>
                </foreignObject>
              </g>
            );
          })}
        </svg>

        {activeItem && (
          <div className="radar-tooltip">
            <strong>{activeItem.name}</strong>
            <span>置信度：{activeItem.confidence}</span>
            <p>{activeItem.evidence}</p>
          </div>
        )}
      </div>
    </section>
  );
}

function AppealSteps({ current }) {
  const steps = [
    { key: "form", label: "填写" },
    { key: "negotiate", label: "AI协商" },
    { key: "supplement", label: "条件人工" },
    { key: "committee", label: "集体审视" },
    { key: "done", label: "完成" },
  ];
  const currentIndex = steps.findIndex((item) => item.key === current);

  return (
    <div className="appeal-steps" aria-label="申诉流程">
      {steps.map((item, index) => (
        <span
          className={`${index === currentIndex ? "active" : ""} ${index < currentIndex ? "done" : ""}`}
          key={item.key}
        >
          {item.label}
        </span>
      ))}
    </div>
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

  .upload-zone.parsing {
    border-color: #f0a030;
    background: #fff8ee;
    cursor: default;
    animation: pulse-border 1.2s ease-in-out infinite;
  }

  @keyframes pulse-border {
    0%, 100% { border-color: #f0a030; }
    50% { border-color: #ffc870; }
  }

  .parse-progress {
    color: #b06a0a;
    font-size: 14px;
    font-weight: 600;
    animation: fade-in 0.3s ease;
  }

  @keyframes fade-in {
    from { opacity: 0; transform: translateY(4px); }
    to { opacity: 1; transform: translateY(0); }
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

  .radar-panel {
    display: grid;
    grid-template-columns: 220px 1fr;
    gap: 18px;
    align-items: center;
    margin-bottom: 22px;
    padding: 18px;
    border: 1px solid #eef1fc;
    border-radius: 8px;
    background: white;
  }

  .radar-copy h2 {
    margin: 0 0 12px;
    font-size: 20px;
    color: #26324a;
  }

  .radar-legend {
    display: grid;
    gap: 8px;
    color: #60708b;
    font-size: 13px;
    font-weight: 800;
  }

  .radar-legend span {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .radar-legend i {
    width: 11px;
    height: 11px;
    border-radius: 50%;
  }

  .legend-low { background: #ffc078; }
  .legend-mid { background: #748ffc; }
  .legend-high { background: #38d9a9; }

  .radar-stage {
    position: relative;
    min-height: 330px;
    display: grid;
    place-items: center;
  }

  .radar-svg {
    width: min(100%, 430px);
    max-height: 360px;
    overflow: visible;
  }

  .radar-ring {
    fill: none;
    stroke: #dfe5fb;
    stroke-width: 1;
  }

  .radar-axis {
    stroke: #edf0f9;
    stroke-width: 1;
  }

  .radar-value {
    fill: rgba(92, 124, 250, 0.2);
    stroke: #5c7cfa;
    stroke-width: 2;
  }

  .radar-dot {
    fill: #5c7cfa;
    stroke: white;
    stroke-width: 2;
    pointer-events: none;
  }

  .radar-dot.dot-high { fill: #38d9a9; }
  .radar-dot.dot-mid { fill: #748ffc; }
  .radar-dot.dot-low { fill: #ffc078; }

  .radar-hit {
    fill: transparent;
    cursor: pointer;
    outline: none;
  }

  .radar-label {
    fill: #26324a;
    font-size: 12px;
    font-weight: 900;
  }

  .radar-level {
    fill: #60708b;
    font-size: 11px;
    font-weight: 800;
  }

  .radar-info {
    width: 24px;
    height: 24px;
    border: 0;
    border-radius: 50%;
    background: #f0f3ff;
    cursor: pointer;
    font-size: 13px;
    line-height: 24px;
  }

  .radar-tooltip {
    position: absolute;
    right: 4px;
    bottom: 4px;
    width: min(260px, 92%);
    padding: 12px 14px;
    border-radius: 8px;
    border: 1px solid #d8dff5;
    background: rgba(255, 255, 255, 0.96);
    box-shadow: 0 16px 34px rgba(82, 103, 161, 0.18);
    color: #42506a;
  }

  .radar-tooltip strong,
  .radar-tooltip span {
    display: block;
  }

  .radar-tooltip strong {
    margin-bottom: 4px;
    color: #26324a;
  }

  .radar-tooltip span {
    color: #5c7cfa;
    font-size: 13px;
    font-weight: 900;
  }

  .radar-tooltip p {
    margin: 6px 0 0;
    font-size: 13px;
    line-height: 1.6;
  }

  .ability-grid {
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: 14px;
    margin-bottom: 20px;
  }

  .grid-section-title {
    margin: 0 0 12px;
    font-size: 15px;
    color: #26324a;
  }

  .ability-item {
    text-align: center;
    padding: 16px 10px;
    border-radius: 8px;
    background: white;
    border: 1px solid #eef1fc;
    color: inherit;
    font: inherit;
    cursor: default;
    transition: border-color 160ms ease, box-shadow 160ms ease, transform 160ms ease;
  }

  .ability-item:disabled {
    opacity: 1;
  }

  .ability-item.disputable {
    cursor: pointer;
  }

  .ability-item.disputable:hover,
  .ability-item.disputed {
    border-color: #5c7cfa;
    box-shadow: 0 10px 24px rgba(92, 124, 250, 0.14);
    transform: translateY(-1px);
  }

  .ability-item.disputed {
    background: #f0f3ff;
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

  .portrait-feedback {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 10px;
    margin: -4px 0 18px;
  }

  .dispute-btn {
    border: 1px solid #d8dff5;
    border-radius: 8px;
    background: white;
    color: #5c7cfa;
    cursor: pointer;
    font: inherit;
    font-weight: 900;
    padding: 10px 14px;
    transition: background 160ms ease, border-color 160ms ease, color 160ms ease;
  }

  .dispute-btn.active,
  .dispute-btn:hover {
    background: #5c7cfa;
    border-color: #5c7cfa;
    color: white;
  }

  .dispute-clear {
    border: 0;
    background: transparent;
    color: #8c97b5;
    cursor: pointer;
    font: inherit;
    font-size: 13px;
    font-weight: 800;
  }

  .portrait-feedback span {
    color: #60708b;
    font-size: 13px;
    font-weight: 700;
  }

  .dispute-panel {
    display: grid;
    gap: 12px;
    margin: -6px 0 18px;
    padding: 16px;
    border: 1px solid #dfe5fb;
    border-radius: 8px;
    background: white;
  }

  .dispute-summary {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    align-items: center;
    color: #42506a;
    font-size: 14px;
  }

  .dispute-summary strong {
    color: #5c7cfa;
  }

  .dispute-panel label {
    display: grid;
    gap: 7px;
    color: #42506a;
    font-size: 14px;
    font-weight: 900;
  }

  .dispute-panel select,
  .dispute-panel textarea {
    width: 100%;
    border: 1px solid #d8dff5;
    border-radius: 8px;
    color: #26324a;
    font: inherit;
    outline: none;
  }

  .dispute-panel select {
    padding: 10px 12px;
    background: #fafbff;
  }

  .dispute-panel textarea {
    padding: 11px 12px;
    resize: vertical;
  }

  .dispute-panel select:focus,
  .dispute-panel textarea:focus {
    border-color: #5c7cfa;
    box-shadow: 0 0 0 4px rgba(92, 124, 250, 0.12);
  }

  .dispute-note {
    margin: 0;
    color: #60708b;
    font-size: 13px;
    line-height: 1.6;
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

  .dimension-details {
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: 14px;
    margin-top: 18px;
  }

  .dimension-card {
    padding: 16px;
    background: white;
    border: 1px solid #edf0f9;
    border-radius: 8px;
    display: grid;
    gap: 8px;
  }

  .dim-card-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
    flex-wrap: wrap;
  }

  .dim-card-header strong {
    color: #26324a;
    font-size: 15px;
  }

  .dim-confidence {
    padding: 3px 8px;
    border-radius: 999px;
    background: #f0f3ff;
    color: #5c7cfa;
    font-size: 11px;
    font-weight: 900;
  }

  .dimension-card p {
    margin: 0;
    color: #60708b;
    font-size: 13px;
    line-height: 1.7;
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

  .growth-progress {
    margin: 8px 0 18px;
    padding: 16px;
    border: 1px solid #e0e4ff;
    border-radius: 8px;
    background: #fafbff;
  }

  .growth-progress-top {
    display: flex;
    justify-content: space-between;
    gap: 12px;
    align-items: center;
    margin-bottom: 10px;
    color: #26324a;
    font-weight: 900;
  }

  .growth-progress-top span {
    color: #5c7cfa;
  }

  .growth-progress-track {
    height: 12px;
    overflow: hidden;
    border-radius: 999px;
    background: #e7ebfa;
  }

  .growth-progress-fill {
    height: 100%;
    border-radius: inherit;
    background: linear-gradient(135deg, #5c7cfa, #9b6dff);
    box-shadow: 0 8px 18px rgba(92, 124, 250, 0.26);
  }

  .growth-progress p {
    margin: 10px 0 0;
    color: #60708b;
    font-size: 13px;
    font-weight: 800;
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

  .growth-guide-list {
    display: grid;
    gap: 12px;
  }

  .growth-guide-item {
    padding: 14px;
    border: 1px solid #edf0f9;
    border-radius: 8px;
    background: #fafbff;
  }

  .growth-guide-item p {
    margin: 0 0 10px;
    color: #42506a;
    font-weight: 800;
    line-height: 1.6;
  }

  .growth-supply-tag {
    display: inline-flex;
    align-items: center;
    max-width: 100%;
    padding: 7px 10px;
    border-radius: 999px;
    background: #f0f3ff;
    color: #5360c9;
    font-size: 13px;
    font-weight: 900;
    line-height: 1.5;
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

  .appeal-form label,
  .appeal-stage label {
    display: grid;
    gap: 8px;
    color: #42506a;
    font-weight: 900;
  }

  .appeal-form textarea,
  .appeal-stage textarea {
    padding-right: 13px;
    resize: vertical;
  }

  .appeal-steps {
    display: grid;
    grid-template-columns: repeat(5, minmax(0, 1fr));
    gap: 8px;
    margin-bottom: 18px;
  }

  .appeal-steps span {
    display: grid;
    place-items: center;
    min-height: 34px;
    border-radius: 8px;
    background: #f2f5fb;
    color: #7a88a5;
    font-size: 12px;
    font-weight: 900;
  }

  .appeal-steps span.active {
    background: #5c7cfa;
    color: white;
  }

  .appeal-steps span.done {
    background: #e4f7ed;
    color: #1a8a4a;
  }

  .appeal-negotiate {
    padding: 16px;
    border-radius: 8px;
    border: 1px solid #d8dff5;
    background: #f8faff;
    color: #42506a;
    line-height: 1.7;
  }

  .appeal-negotiate strong {
    display: block;
    margin-bottom: 6px;
    color: #5c7cfa;
  }

  .appeal-negotiate p {
    margin: 0;
  }

  .appeal-actions {
    display: flex;
    flex-wrap: wrap;
    gap: 12px;
    margin-top: 18px;
  }

  .appeal-stage {
    display: grid;
    gap: 16px;
  }

  .appeal-stage.done {
    text-align: center;
  }

  .appeal-upload-placeholder {
    display: grid;
    place-items: center;
    min-height: 88px;
    border: 2px dashed #c8d2f0;
    border-radius: 8px;
    background: #fafbff;
    color: #7a88a5;
    font-weight: 800;
    text-align: center;
    padding: 14px;
  }

  .appeal-status {
    margin: 0;
    padding: 14px 16px;
    border-radius: 8px;
    background: #f0f3ff;
    color: #4e60d8;
    font-weight: 900;
    line-height: 1.6;
  }

  .appeal-status.muted {
    background: #f3f5f9;
    color: #60708b;
    font-size: 13px;
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
    .ability-grid,
    .dimension-details {
      grid-template-columns: 1fr 1fr;
    }

    .field-row,
    .match-top,
    .radar-panel {
      grid-template-columns: 1fr;
    }

    .radar-copy {
      text-align: center;
    }

    .radar-legend {
      display: flex;
      flex-wrap: wrap;
      justify-content: center;
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
    .ability-grid,
    .dimension-details {
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
