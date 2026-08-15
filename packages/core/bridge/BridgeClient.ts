import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

export class BridgeClient {
  private port: number;
  private tokenPath: string;

  constructor(port: number = 18881) {
    this.port = port;
    this.tokenPath = path.join(os.homedir(), '.three', 'bridge_token');
  }

  private getToken(): string {
    if (!fs.existsSync(this.tokenPath)) {
      throw new Error(`Local bridge token not found at ${this.tokenPath}. Please start the Three desktop app first.`);
    }
    return fs.readFileSync(this.tokenPath, 'utf-8').trim();
  }

  public async invokeCommand(command: string, args: Record<string, any>): Promise<any> {
    const token = this.getToken();
    const url = `http://127.0.0.1:${this.port}/`;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ command, args }),
    });

    if (!response.ok) {
      throw new Error(`HTTP Error ${response.status}`);
    }

    const data = await response.json();
    if (!data.success) {
      throw new Error(data.message);
    }

    return data.message;
  }
}
