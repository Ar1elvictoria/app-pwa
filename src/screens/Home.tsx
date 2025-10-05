import "../App.css";

export default function App() {
  return (
    <div className="app-container">
      <header className="app-header">
        <h1>Gestión de Internet</h1>
        <p>Monitorea y administra tu red fácilmente.</p>
      </header>

      <main className="app-main">
        <section className="card">
          <h2>Dispositivos conectados</h2>
          <p>3 activos / 1 inactivo</p>
        </section>

        <section className="card">
          <h2>Consumo actual</h2>
          <p>12.3 Mbps</p>
        </section>

        <section className="card">
          <h2>Estado del servicio</h2>
          <p>✅ Estable</p>
        </section>
      </main>
    </div>
  );
}
