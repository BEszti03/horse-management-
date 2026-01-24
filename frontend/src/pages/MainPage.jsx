import { useState, useMemo } from "react";
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

  const backgroundImage = useMemo(() => {
    const idx = Math.floor(Math.random() * backgrounds.length);
    return backgrounds[idx];
  }, []);

  return (
     <div
      className="mainpage"
      style={{ backgroundImage: `url(${backgroundImage})` }}
    >
      <div className="mainpage__card">
        <h1 className="mainpage__title">Horse Time Management</h1>
        <p className="mainpage__subtitle">Lovas teendők és időbeosztás egyszerűen</p>

        <div className="mainpage__tabs">
          <button
            className={`mainpage__tab ${activeTab === "login" ? "active" : ""}`}
            onClick={() => setActiveTab("login")}
            type="button"
          >
            Belépés
          </button>
          <button
            className={`mainpage__tab ${activeTab === "register" ? "active" : ""}`}
            onClick={() => setActiveTab("register")}
            type="button"
          >
            Regisztráció
          </button>
        </div>

        <div className="mainpage__content">
          {activeTab === "login" ? (
            <Login embedded onSwitchTab={setActiveTab} />
          ) : (
            <Register embedded onSwitchTab={setActiveTab} />
          )}
        </div>
      </div>
    </div>
  );
}

export default MainPage;
