import { useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import "./App.css";

function App() {
  const [greetMsg, setGreetMsg] = useState("");
  const [appName, setAppName] = useState("Calculator");
  const [clipboardText, setClipboardText] = useState("");

  async function greet() {
    setGreetMsg(await invoke("greet", { name: "Three Developer" }));
  }

  async function openApp() {
    try {
      const res = await invoke("open_application", { name: appName });
      console.log(res);
    } catch (e) {
      console.error(e);
    }
  }

  async function getClipboard() {
    try {
      const res: string = await invoke("get_clipboard");
      setClipboardText(res);
    } catch (e) {
      console.error(e);
    }
  }

  async function setClipboard() {
    try {
      await invoke("set_clipboard", { text: clipboardText });
      console.log("Clipboard set");
    } catch (e) {
      console.error(e);
    }
  }

  return (
    <main className="container">
      <h1>Three — Phase 1 Test</h1>

      <div className="row">
        <button onClick={greet}>Greet</button>
        <p>{greetMsg}</p>
      </div>

      <div className="row">
        <input
          placeholder="Application name"
          value={appName}
          onChange={(e) => setAppName(e.currentTarget.value)}
        />
        <button onClick={openApp}>Open Application</button>
      </div>

      <div className="row">
        <input
          placeholder="Clipboard text"
          value={clipboardText}
          onChange={(e) => setClipboardText(e.currentTarget.value)}
        />
        <button onClick={setClipboard}>Set Clipboard</button>
        <button onClick={getClipboard}>Get Clipboard</button>
      </div>
    </main>
  );
}

export default App;
