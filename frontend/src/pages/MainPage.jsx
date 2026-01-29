import { useEffect, useMemo, useState, useCallback } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import Login from "./Login";
import Register from "./Register";
import "./MainPage.css";

import bg1 from "../assets/bg1.png";
import bg2 from "../assets/bg2.png";
import bg3 from "../assets/bg3.png";
import bg4 from "../assets/bg4.png";
import bg5 from "../assets/bg5.png";
import bg6 from "../assets/bg6.png";
import bg7 from "../assets/bg7.png";

const backgrounds = [bg1, bg2, bg3, bg4, bg5, bg6, bg7];

function MainPage() {
  const [activeTab, setActiveTab] = useState("login");
  const [showAuthRequiredMsg, setShowAuthRequiredMsg] = useState(false);

  // "flash" üzenet embedded regisztráció után (Login komponens olvassa ki)
  const [embeddedSuccessMsg, setEmbeddedSuccessMsg] = useState("");

  const location = useLocation();
  const navigate = useNavigate();

  // Háttérkép random
  const backgroundImage = useMemo(() => {
    const idx = Math.floor(Math.random() * backgrounds.length);
    return backgrounds[idx];
  }, []);

  // Ha ProtectedRoute dobott ide:
  // - álljunk Login tabra
  // - állítsuk be a helyi üzenetet
  // - majd "fogyasszuk el" a router state-et (replace), hogy refresh után ne maradjon meg
  useEffect(() => {
    if (location.state?.authRequired) {
      setActiveTab("login");
      setShowAuthRequiredMsg(true);
      navigate(location.pathname, { replace: true, state: null });
    }
  }, [location.state, location.pathname, navigate]);

  const clearEmbeddedSuccessMsg = useCallback(() => {
    setEmbeddedSuccessMsg("");
  }, []);

  // Register embedded siker esetén: Sikeres regisztráció!
  const handleSwitchTab = useCallback((tab, msg) => {
    setActiveTab(tab);
    setShowAuthRequiredMsg(false);
    if (msg) setEmbeddedSuccessMsg(msg);
  }, []);

  const handleTabClick = useCallback((tab) => {
    setActiveTab(tab);
    // ha manuálisan tabot vált, ne maradjon kint a "jelentkezz be" üzenet
    setShowAuthRequiredMsg(false);
  }, []);

  return (
    <div className="mainpage" style={{ backgroundImage: `url(${backgroundImage})` }}>
      <div className="mainpage__card">
        <h1 className="mainpage__title">Horse Time Management</h1>
        <p className="mainpage__subtitle">Lovas teendők és időbeosztás egyszerűen</p>

        {showAuthRequiredMsg && (
          <div className="mainpage__info">
            Az oldal megtekintéséhez először be kell jelentkeznie.
          </div>
        )}

        <div className="mainpage__tabs">
          <button
            type="button"
            className={`mainpage__tab ${activeTab === "login" ? "active" : ""}`}
            onClick={() => handleTabClick("login")}
          >
            Belépés
          </button>

          <button
            type="button"
            className={`mainpage__tab ${activeTab === "register" ? "active" : ""}`}
            onClick={() => handleTabClick("register")}
          >
            Regisztráció
          </button>
        </div>

        <div className="mainpage__content">
          {activeTab === "login" ? (
            <Login
              embedded
              onSwitchTab={handleSwitchTab}
              embeddedSuccessMsg={embeddedSuccessMsg}
              clearEmbeddedSuccessMsg={clearEmbeddedSuccessMsg}
            />
          ) : (
            <Register embedded onSwitchTab={handleSwitchTab} />
          )}
        </div>
      </div>
    </div>
  );
}

export default MainPage;
