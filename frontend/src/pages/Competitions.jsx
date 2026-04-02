import { useEffect, useState } from "react";
import Header from "../components/Header";
import { apiFetch } from "../utils/api";
import "./Competitions.css";

function Competitions() {
  const [entries, setEntries] = useState([]);

  useEffect(() => {
    async function fetchData() {
      const data = await apiFetch("/api/competitions/entries");
      setEntries(data);
    }

    fetchData();
  }, []);

  return (
    <div>
      <Header />
      <div className="competitions-container">
        <h2>Verseny jelentkezések</h2>

        {entries.map((entry, index) => (
          <div key={index} className="competition-card">
            <h3>{entry.verseny_nev}</h3>
            <p><strong>Felhasználó:</strong> {entry.felhasznalo_nev}</p>
            <p><strong>Email:</strong> {entry.email}</p>
            <p><strong>Ló:</strong> {entry.lo_nev}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

export default Competitions;