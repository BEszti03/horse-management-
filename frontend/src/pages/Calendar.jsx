import Header from "../components/Header";

function Calendar() {
  return (
    <div>
      <Header />
      <main style={{ padding: "24px" }}>
        <h1>Naptár</h1>
        <p>(Később napi/heti nézet.)</p>
      </main>
    </div>
  );
}

export default Calendar;