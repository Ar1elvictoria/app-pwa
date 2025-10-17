import { useEffect } from "react";

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
        background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        color: "white",
        transition: "opacity 0.3s ease",
        position: "relative",
        overflow: "hidden"
      }}
    >
      {/* Background decoration */}
      <div style={{
        position: "absolute",
        top: "-50%",
        left: "-50%",
        width: "200%",
        height: "200%",
        background: "radial-gradient(circle, rgba(255,255,255,0.1) 1px, transparent 1px)",
        backgroundSize: "50px 50px",
        animation: "float 20s ease-in-out infinite",
        opacity: 0.3
      }} />
      
      {/* Logo container */}
      <div style={{
        background: "rgba(255, 255, 255, 0.15)",
        borderRadius: "50%",
        padding: "2rem",
        marginBottom: "2rem",
        boxShadow: "0 20px 40px rgba(0, 0, 0, 0.1)",
        backdropFilter: "blur(10px)",
        border: "1px solid rgba(255, 255, 255, 0.2)",
        animation: "pulse 2s ease-in-out infinite"
      }}>
        <img 
          src="/icons/icon-192x192.png" 
          alt="logo" 
          style={{ 
            width: 96, 
            height: 96,
            filter: "drop-shadow(0 4px 8px rgba(0, 0, 0, 0.2))"
          }} 
        />
      </div>
      
      {/* App name */}
      <h1 style={{ 
        margin: 0,
        fontSize: "2.5rem", 
        fontWeight: "700",
        textShadow: "0 4px 8px rgba(0, 0, 0, 0.3)",
        letterSpacing: "0.5px",
        marginBottom: "0.5rem"
      }}>
        GestiónNet
      </h1>
      
      {/* Subtitle */}
      <p style={{
        margin: 0,
        fontSize: "1.1rem",
        opacity: 0.9,
        fontWeight: "300",
        textAlign: "center",
        maxWidth: "300px",
        lineHeight: "1.4"
      }}>
        Gestión inteligente de redes de internet
      </p>
      
      {/* Loading indicator */}
      <div style={{
        marginTop: "3rem",
        display: "flex",
        gap: "0.5rem"
      }}>
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            style={{
              width: "8px",
              height: "8px",
              borderRadius: "50%",
              backgroundColor: "rgba(255, 255, 255, 0.8)",
              animation: `bounce 1.4s ease-in-out ${i * 0.16}s infinite both`
            }}
          />
        ))}
      </div>

      <style>
        {`
          @keyframes pulse {
            0%, 100% {
              transform: scale(1);
            }
            50% {
              transform: scale(1.05);
            }
          }
          
          @keyframes float {
            0%, 100% {
              transform: translateY(0px) rotate(0deg);
            }
            50% {
              transform: translateY(-20px) rotate(180deg);
            }
          }
          
          @keyframes bounce {
            0%, 80%, 100% {
              transform: scale(0);
            }
            40% {
              transform: scale(1);
            }
          }
        `}
      </style>
    </div>
  );
}
