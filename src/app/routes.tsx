import { createBrowserRouter } from "react-router";
import { RootLayout } from "./components/RootLayout";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { Overview } from "./pages/Overview";
import { Assets } from "./pages/Assets";
import { AssetDetail } from "./pages/AssetDetail";
import { AttackGraph } from "./pages/AttackGraph";
import { ExposureMap } from "./pages/ExposureMap";
import { AIRiskCenter } from "./pages/AIRiskCenter";
import { Monitoring } from "./pages/Monitoring";
import { Reports } from "./pages/Reports";
import { Settings } from "./pages/Settings";
import { Login } from "./pages/Login";

export const router = createBrowserRouter([
  { path: "/login", Component: Login },
  {
    path: "/",
    element: (
      <ProtectedRoute>
        <RootLayout />
      </ProtectedRoute>
    ),
    children: [
      { index: true, Component: Overview },
      { path: "assets", Component: Assets },
      { path: "assets/:assetId", Component: AssetDetail },
      { path: "attack-graph", Component: AttackGraph },
      { path: "exposure-map", Component: ExposureMap },
      { path: "ai-risk", Component: AIRiskCenter },
      { path: "monitoring", Component: Monitoring },
      { path: "reports", Component: Reports },
      { path: "settings", Component: Settings },
    ],
  },
]);
