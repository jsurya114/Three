import { PermissionRepository } from './PermissionRepository';
import { PermissionRecord } from './types';
import * as fs from 'fs';
import * as path from 'path';

export class JsonPermissionRepository implements PermissionRepository {
  private dbPath: string;
  private auditPath: string;
  private lock: boolean = false;

  constructor(workspacePath: string) {
    this.dbPath = path.join(workspacePath, 'permissions.json');
    this.auditPath = path.join(workspacePath, 'permissions_audit.jsonl');

    if (!fs.existsSync(this.dbPath)) {
      fs.writeFileSync(this.dbPath, JSON.stringify([]));
    }
  }

  private async acquireLock(): Promise<void> {
    while (this.lock) {
      await new Promise((resolve) => setTimeout(resolve, 10));
    }
    this.lock = true;
  }

  private releaseLock(): void {
    this.lock = false;
  }

  async getAllPermissions(): Promise<PermissionRecord[]> {
    await this.acquireLock();
    try {
      if (!fs.existsSync(this.dbPath)) return [];
      const content = fs.readFileSync(this.dbPath, 'utf-8');
      if (!content) return [];
      return JSON.parse(content) as PermissionRecord[];
    } catch (error) {
      console.error('Failed to read permissions.json', error);
      return [];
    } finally {
      this.releaseLock();
    }
  }

  async getPermissionById(id: string): Promise<PermissionRecord | null> {
    const all = await this.getAllPermissions();
    return all.find(p => p.id === id) || null;
  }

  async savePermission(record: PermissionRecord): Promise<void> {
    await this.acquireLock();
    try {
      let permissions: PermissionRecord[] = [];
      if (fs.existsSync(this.dbPath)) {
        const content = fs.readFileSync(this.dbPath, 'utf-8');
        permissions = content ? JSON.parse(content) : [];
      }
      
      const index = permissions.findIndex(p => p.id === record.id);
      if (index !== -1) {
        permissions[index] = record;
      } else {
        permissions.push(record);
      }

      // Atomic write: write to temp file then rename
      const tmpPath = this.dbPath + '.tmp';
      fs.writeFileSync(tmpPath, JSON.stringify(permissions, null, 2));
      fs.renameSync(tmpPath, this.dbPath);
    } finally {
      this.releaseLock();
    }
  }

  async revokePermission(id: string): Promise<void> {
    await this.acquireLock();
    try {
      if (!fs.existsSync(this.dbPath)) return;
      const content = fs.readFileSync(this.dbPath, 'utf-8');
      let permissions: PermissionRecord[] = content ? JSON.parse(content) : [];
      permissions = permissions.filter(p => p.id !== id);

      const tmpPath = this.dbPath + '.tmp';
      fs.writeFileSync(tmpPath, JSON.stringify(permissions, null, 2));
      fs.renameSync(tmpPath, this.dbPath);
    } finally {
      this.releaseLock();
    }
  }

  async logAuditEvent(event: any): Promise<void> {
    await this.acquireLock();
    try {
      const line = JSON.stringify({
        ...event,
        timestamp: new Date().toISOString()
      }) + '\n';
      fs.appendFileSync(this.auditPath, line);
    } finally {
      this.releaseLock();
    }
  }
}
