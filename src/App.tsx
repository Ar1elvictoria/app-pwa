import { useState } from "react";
import SplashScreen from "./screens/SplashScreen";
import ClientesScreen from "./screens/ClientesScreen";
import OfflineIndicator from "./components/OfflineIndicator";

export default function App() {
  const [showSplash, setShowSplash] = useState(true);

  return (
    <>
      <OfflineIndicator />
      {showSplash ? (
        <SplashScreen onDone={() => setShowSplash(false)} />
      ) : (
        <ClientesScreen />
      )}
    </>
  );
}
