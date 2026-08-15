import { WebSocketServer, WebSocket } from 'ws';
import * as crypto from 'crypto';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { PermissionRequest, PermissionResponse, PermissionState } from './types';
import { UIBridge } from './PermissionManager';

export class WebSocketUIBridge implements UIBridge {
  private wss: WebSocketServer | null = null;
  private client: WebSocket | null = null;
  private pendingRequests: Map<string, { resolve: (res: PermissionResponse) => void, reject: (err: any) => void, timeoutId: NodeJS.Timeout }> = new Map();
  private authToken: string;

  constructor(private port: number = 18882) {
    this.authToken = crypto.randomUUID();
    
    // Write token securely to ~/.three/ws_token
    const threeDir = path.join(os.homedir(), '.three');
    if (!fs.existsSync(threeDir)) {
      fs.mkdirSync(threeDir, { recursive: true });
    }
    fs.writeFileSync(path.join(threeDir, 'ws_token'), this.authToken, { mode: 0o600 });
  }

  public async start(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.wss = new WebSocketServer({ port: this.port, host: '127.0.0.1' });

      this.wss.on('listening', () => resolve());
      
      this.wss.on('connection', (ws, req) => {
        // Enforce localhost origin if applicable
        const origin = req.headers.origin;
        // In local Tauri apps, origin might be tauri://localhost or http://tauri.localhost
        // For simplicity and strictness in Phase 2, we just require the auth token in the first message.
        
        let authenticated = false;

        ws.on('message', (data) => {
          try {
            const msg = JSON.parse(data.toString());

            if (!authenticated) {
              if (msg.type === 'auth' && msg.token === this.authToken) {
                authenticated = true;
                this.client = ws;
                ws.send(JSON.stringify({ type: 'auth_success' }));
              } else {
                ws.close(1008, 'Unauthorized');
              }
              return;
            }

            if (msg.type === 'permission_response') {
              const response = msg.response as PermissionResponse;
              const pending = this.pendingRequests.get(response.requestId);
              if (pending) {
                clearTimeout(pending.timeoutId);
                this.pendingRequests.delete(response.requestId);
                pending.resolve(response);
              }
            }
          } catch (e) {
            console.error('Invalid WS message', e);
          }
        });

        ws.on('close', () => {
          if (this.client === ws) {
            this.client = null;
            // Reject all pending requests
            for (const [id, pending] of this.pendingRequests.entries()) {
              clearTimeout(pending.timeoutId);
              pending.reject(new Error('UI Disconnected'));
            }
            this.pendingRequests.clear();
          }
        });
      });
      
      this.wss.on('error', (err) => reject(err));
    });
  }

  public async stop(): Promise<void> {
    if (this.wss) {
      this.wss.close();
      this.wss = null;
    }
    this.client = null;
  }

  public async requestUserPermission(request: PermissionRequest, timeoutMs: number = 60000): Promise<PermissionResponse> {
    if (!this.client) {
      // If UI is not connected, fail securely or wait?
      // Strict behavior: fail if no UI can authorize it.
      throw new Error('No UI connected to authorize permission request.');
    }

    return new Promise((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        this.pendingRequests.delete(request.id);
        reject(new Error('Permission request timed out.'));
      }, timeoutMs);

      this.pendingRequests.set(request.id, { resolve, reject, timeoutId });

      this.client!.send(JSON.stringify({
        type: 'permission_request',
        request
      }));
    });
  }
}
