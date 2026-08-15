import { PermissionRecord } from './types';

export interface PermissionRepository {
  /** Retrieves all saved permissions */
  getAllPermissions(): Promise<PermissionRecord[]>;
  
  /** Retrieves a specific permission by ID */
  getPermissionById(id: string): Promise<PermissionRecord | null>;
  
  /** Saves or updates a permission */
  savePermission(record: PermissionRecord): Promise<void>;
  
  /** Removes a permission */
  revokePermission(id: string): Promise<void>;
  
  /** Logs an audit event */
  logAuditEvent(event: any): Promise<void>;
}
