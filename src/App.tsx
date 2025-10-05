import { useState } from "react";
import SplashScreen from "./screens/SplashScreen";
import Home from "./screens/Home";

export default function App() {
  const [showSplash, setShowSplash] = useState(true);

  return showSplash ? (
    <SplashScreen onDone={() => setShowSplash(false)} />
  ) : (
    <Home />
  );
}
