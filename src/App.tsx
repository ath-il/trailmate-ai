import { useState } from "react";
import { BottomNav, type Tab } from "./components/BottomNav";
import { HomePage } from "./pages/HomePage";
import { JournalPage } from "./pages/JournalPage";
import { MissionPage } from "./pages/MissionPage";
import { SettingsPage } from "./pages/SettingsPage";
import { AIProvider } from "./state/AIContext";
import { AppProvider, useApp } from "./state/AppContext";

function Shell() {
  const { activeMission, setActiveMission } = useApp();
  const [tab, setTab] = useState<Tab>("home");

  if (activeMission) {
    return (
      <main className="mx-auto min-h-screen max-w-md px-4 pt-4">
        <MissionPage
          mission={activeMission}
          onExit={() => setActiveMission(null)}
        />
      </main>
    );
  }

  return (
    <>
      <main className="mx-auto min-h-screen max-w-md px-4 pt-4">
        {tab === "home" && <HomePage />}
        {tab === "journal" && <JournalPage />}
        {tab === "settings" && <SettingsPage />}
      </main>
      <BottomNav current={tab} onChange={setTab} />
    </>
  );
}

export default function App() {
  return (
    <AppProvider>
      <AIProvider>
        <Shell />
      </AIProvider>
    </AppProvider>
  );
}
