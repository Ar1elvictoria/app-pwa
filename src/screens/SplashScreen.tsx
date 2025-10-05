import React, { useEffect } from "react";

export default function SplashScreen({ onDone }: { onDone: () => void }) {
  useEffect(() => {
    const timer = setTimeout(onDone, 2000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div
      style={{
        height: "100vh",
        width: "100vw",
        backgroundColor: "#1976d2",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        color: "white",
        transition: "opacity 0.3s ease"
      }}
    >
      <img src="/icons/icon-192x192.png" alt="logo" style={{ width: 96, height: 96 }} />
      <h1 style={{ marginTop: 16, fontSize: 24 }}>GestiónNet</h1>
    </div>
  );
}
