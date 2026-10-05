import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "@fontsource-variable/inter";
import "@fontsource-variable/jetbrains-mono";
import { App } from "./App.tsx";
import { toast } from "./components/ui/toastStore.ts";
import "./styles/index.css";

// Last line of defense: any async error nobody caught still reaches the user as a toast.
window.addEventListener("unhandledrejection", (e) => {
  const reason: unknown = e.reason;
  toast({
    kind: "error",
    message: `Unexpected error: ${reason instanceof Error ? reason.message : String(reason)}`,
  });
});

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
