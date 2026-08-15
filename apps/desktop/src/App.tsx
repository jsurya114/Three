import { useState, useEffect, useRef } from "react";
import { invoke } from "@tauri-apps/api/core";
import "./App.css";

interface PermissionRequest {
  id: string;
  scope: string;
  operation: string;
  resource: string;
  reason: string;
}

function App() {
  const [greetMsg, setGreetMsg] = useState("");
  const [appName, setAppName] = useState("Calculator");
  const [requests, setRequests] = useState<PermissionRequest[]>([]);
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    let reconnectTimeout: NodeJS.Timeout;

    async function connect() {
      try {
        const token: string = await invoke("get_ws_token");
        const ws = new WebSocket("ws://127.0.0.1:18882");
        wsRef.current = ws;

        ws.onopen = () => {
          console.log("WebSocket connected");
          ws.send(JSON.stringify({ type: "auth", token }));
        };

        ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            if (data.type === "permission_request") {
              setRequests((prev) => [...prev, data.request]);
            }
          } catch (e) {
            console.error(e);
          }
        };

        ws.onclose = () => {
          console.log("WebSocket disconnected, reconnecting...");
          reconnectTimeout = setTimeout(connect, 3000);
        };
      } catch (e) {
        console.error("Failed to get WS token", e);
        reconnectTimeout = setTimeout(connect, 3000);
      }
    }

    connect();

    return () => {
      clearTimeout(reconnectTimeout);
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, []);

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

  function respondToPermission(id: string, decision: string) {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(
        JSON.stringify({
          type: "permission_response",
          response: { requestId: id, decision },
        })
      );
    }
    setRequests((prev) => prev.filter((r) => r.id !== id));
  }

  return (
    <main className="container">
      <h1>Three — Phase 2 Testing</h1>

      {requests.length > 0 && (
        <div className="permission-modal" style={{ border: '2px solid red', padding: '10px', marginBottom: '20px' }}>
          <h2>Permission Required</h2>
          {requests.map((req) => (
            <div key={req.id} style={{ borderBottom: '1px solid #ccc', paddingBottom: '10px' }}>
              <p><strong>Reason:</strong> {req.reason}</p>
              <p><strong>Scope:</strong> {req.scope}</p>
              <p><strong>Operation:</strong> {req.operation}</p>
              <p><strong>Resource:</strong> {req.resource}</p>
              <div style={{ display: 'flex', gap: '10px' }}>
                <button onClick={() => respondToPermission(req.id, "ALLOW_ONCE")}>Allow Once</button>
                <button onClick={() => respondToPermission(req.id, "ALWAYS_ALLOW")}>Always Allow</button>
                <button onClick={() => respondToPermission(req.id, "DENY")}>Deny</button>
              </div>
            </div>
          ))}
        </div>
      )}

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
        <button onClick={openApp}>Open Application (Direct UI Test)</button>
      </div>
    </main>
  );
}

export default App;
