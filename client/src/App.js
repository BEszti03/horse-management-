function App() {
  return (
    <div style={{ fontFamily: "Arial, sans-serif" }}>
      
      {/* Header */}
      <header style={styles.header}>
        <h2>Horse Time Management</h2>
        <div>Eszter</div>
      </header>

      {/* Mai összefoglaló */}
      <section style={styles.box}>
        <h3>📅 Mai nap</h3>
        <p>✔ Kész: 2 teendő</p>
        <p>⏳ Függő: 1 teendő</p>
      </section>

      {/* Mai teendők */}
      <section style={styles.box}>
        <h3>Mai teendők</h3>
        <ul>
          <li>✔ Etetés – Bella</li>
          <li>⏳ Patkolás – Csillag</li>
        </ul>
      </section>

      {/* Gyors műveletek */}
      <div style={styles.actions}>
        <button>+ Új teendő</button>
        <button>🐎 Lovaim</button>
      </div>

    </div>
  );
}

const styles = {
  header: {
    display: "flex",
    justifyContent: "space-between",
    padding: "16px",
    backgroundColor: "#f0f0f0"
  },
  box: {
    padding: "16px",
    margin: "16px",
    border: "1px solid #ddd"
  },
  actions: {
    display: "flex",
    justifyContent: "center",
    gap: "12px",
    margin: "24px"
  }
};

export default App;