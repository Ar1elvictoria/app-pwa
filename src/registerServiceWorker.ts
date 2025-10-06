export function registerSW() {
  if ("serviceWorker" in navigator) {
    window.addEventListener("load", () => {
      navigator.serviceWorker
        .register("../service-worker.js")
        .then((registration) => {
          console.log("Service Worker registrado:", registration);
        })
        .catch((err) => {
          console.error("Error registrando Service Worker:", err);
        });
    });
  }
}
