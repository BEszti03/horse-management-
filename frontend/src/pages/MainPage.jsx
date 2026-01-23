import { useState } from "react";
import Login from "./Login";
import Register from "./Register";
import "./MainPage.css";

function MainPage() {
  const [activeTab, setActiveTab] = useState("login");

  return (
    <div className="mainpage">
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
