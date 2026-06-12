import React from "react";
import {
  BrowserRouter,
  Link,
  Route,
  Routes,
  useNavigate,
} from "react-router-dom";

import DemoPage from "./pages/DemoPage";
import MainFlow from "./pages/MainFlow";


function HomePage() {
  const navigate = useNavigate();

  return (
    <main className="home-page">
      <section className="home-hero">
        <h1>AI 定岗解释官</h1>
        <p>让推荐有依据，让选择被尊重</p>
        <button
          className="import-button"
          onClick={() => navigate("/demo")}
          type="button"
        >
          ✨ 开启我的能力画像与岗位推荐
        </button>
      </section>
    </main>
  );
}


function App() {
  return (
    <BrowserRouter>
      <style>{appStyles}</style>
      <nav className="app-nav">
        <Link className="brand" to="/">
          HR AI Copilot
        </Link>
        <div className="nav-links">
          <Link to="/">首页</Link>
          <Link to="/demo">Demo</Link>
        </div>
      </nav>

      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/demo" element={<MainFlow />} />
      </Routes>
    </BrowserRouter>
  );
}


const appStyles = `
  * {
    box-sizing: border-box;
  }

  body {
    margin: 0;
    color: #172033;
    font-family: Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", "Microsoft YaHei", sans-serif;
    background: #f7fbff;
  }

  a {
    color: inherit;
    text-decoration: none;
  }

  .app-nav {
    position: sticky;
    top: 0;
    z-index: 10;
    display: flex;
    align-items: center;
    justify-content: space-between;
    min-height: 64px;
    padding: 0 28px;
    border-bottom: 1px solid rgba(22, 119, 255, 0.12);
    background: rgba(255, 255, 255, 0.86);
    backdrop-filter: blur(14px);
    box-shadow: 0 10px 28px rgba(27, 84, 140, 0.08);
  }

  .brand {
    color: #1677ff;
    font-size: 18px;
    font-weight: 800;
  }

  .nav-links {
    display: flex;
    gap: 10px;
  }

  .nav-links a {
    padding: 9px 14px;
    border-radius: 8px;
    color: #526070;
    font-weight: 700;
    transition: background 160ms ease, color 160ms ease;
  }

  .nav-links a:hover {
    background: #edf6ff;
    color: #1677ff;
  }

  .home-page {
    display: grid;
    min-height: calc(100vh - 64px);
    place-items: center;
    padding: 48px 20px;
    background:
      radial-gradient(circle at top left, rgba(22, 119, 255, 0.18), transparent 32%),
      linear-gradient(135deg, #f7fbff 0%, #eef6ff 52%, #f8fbf7 100%);
  }

  .home-hero {
    width: min(860px, 100%);
    padding: 56px 42px;
    border: 1px solid rgba(22, 119, 255, 0.14);
    border-radius: 8px;
    background: rgba(255, 255, 255, 0.88);
    box-shadow: 0 24px 70px rgba(27, 84, 140, 0.13);
    text-align: center;
  }

  .home-eyebrow {
    margin: 0 0 12px;
    color: #1677ff;
    font-size: 13px;
    font-weight: 800;
    letter-spacing: 0;
    text-transform: uppercase;
  }

  .home-hero h1 {
    margin: 0 0 18px;
    font-size: clamp(36px, 6vw, 62px);
    line-height: 1.08;
    letter-spacing: 0;
  }

  .home-hero p {
    max-width: 620px;
    margin: 0 auto 30px;
    color: #526070;
    font-size: 17px;
    line-height: 1.75;
  }

  .import-button {
    padding: 16px 28px;
    border: 0;
    border-radius: 8px;
    background: linear-gradient(135deg, #1677ff, #13c2c2);
    color: #ffffff;
    cursor: pointer;
    font: inherit;
    font-size: 18px;
    font-weight: 900;
    box-shadow: 0 16px 34px rgba(22, 119, 255, 0.28);
    transition: transform 160ms ease, box-shadow 160ms ease, filter 160ms ease;
  }

  .import-button:hover {
    transform: translateY(-3px);
    box-shadow: 0 22px 42px rgba(22, 119, 255, 0.34);
    filter: brightness(1.03);
  }

  @media (max-width: 640px) {
    .app-nav {
      padding: 0 16px;
    }

    .home-hero {
      padding: 38px 22px;
    }

    .import-button {
      width: 100%;
    }
  }
`;

export default App;
