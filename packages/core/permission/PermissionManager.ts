import { PermissionRepository } from './PermissionRepository';
import { PermissionScope, PermissionOperation, PermissionState, PermissionRequest, PermissionResponse } from './types';
import { getCanonicalPath, isPathChildOf } from './utils';
import * as crypto from 'crypto';

export interface UIBridge {
  requestUserPermission(request: PermissionRequest, timeoutMs?: number): Promise<PermissionResponse>;
}

export class PermissionManager {
  constructor(
    private repository: PermissionRepository,
    private uiBridge: UIBridge
  ) {}

  private isOperationMatch(grantedScope: PermissionScope, grantedOp: PermissionOperation, requestedScope: PermissionScope, requestedOp: PermissionOperation): boolean {
    if (grantedScope === requestedScope && grantedOp === requestedOp) return true;
    
    // Directory inheritance to files
    if (grantedScope === PermissionScope.DIRECTORY && requestedScope === PermissionScope.FILE) {
      if (grantedOp === PermissionOperation.DIRECTORY_READ && requestedOp === PermissionOperation.FILE_READ) return true;
      if (grantedOp === PermissionOperation.DIRECTORY_WRITE && requestedOp === PermissionOperation.FILE_WRITE) return true;
      if (grantedOp === PermissionOperation.DIRECTORY_DELETE && requestedOp === PermissionOperation.FILE_DELETE) return true;
    }
    
    return false;
  }

  /**
   * Checks if a permission is already granted/denied.
   */
  async checkPermission(scope: PermissionScope, operation: PermissionOperation, resource: string): Promise<PermissionState> {
    const canonicalResource = (scope === PermissionScope.FILE || scope === PermissionScope.DIRECTORY)
      ? getCanonicalPath(resource)
      : resource;

    const all = await this.repository.getAllPermissions();
    
    // First, check for explicitly denied permissions that match
    for (const p of all) {
      if (p.state === PermissionState.DENY && this.isOperationMatch(p.scope, p.operation, scope, operation)) {
        if (this.isResourceMatch(p.scope, canonicalResource, p.resource)) {
          await this.repository.logAuditEvent({ action: 'CHECK', result: 'DENY (Explicit)', scope, operation, resource });
          return PermissionState.DENY;
        }
      }
    }

    // Next, check for always allow
    for (const p of all) {
      if (p.state === PermissionState.ALWAYS_ALLOW && this.isOperationMatch(p.scope, p.operation, scope, operation)) {
        if (this.isResourceMatch(p.scope, canonicalResource, p.resource)) {
          await this.repository.logAuditEvent({ action: 'CHECK', result: 'ALWAYS_ALLOW', scope, operation, resource });
          return PermissionState.ALWAYS_ALLOW;
        }
      }
    }

    // Then check for allow once
    for (const p of all) {
      if (p.state === PermissionState.ALLOW_ONCE && this.isOperationMatch(p.scope, p.operation, scope, operation)) {
        if (this.isResourceMatch(p.scope, canonicalResource, p.resource)) {
          // Consume the ALLOW_ONCE permission
          await this.repository.revokePermission(p.id);
          await this.repository.logAuditEvent({ action: 'CHECK', result: 'ALLOW_ONCE (Consumed)', scope, operation, resource });
          return PermissionState.ALLOW_ONCE;
        }
      }
    }

    await this.repository.logAuditEvent({ action: 'CHECK', result: 'ASK', scope, operation, resource });
    return PermissionState.ASK;
  }

  /**
   * Requests permission from the user if not already granted.
   * Blocks until the user responds or timeout.
   */
  async requirePermission(scope: PermissionScope, operation: PermissionOperation, resource: string, reason: string): Promise<boolean> {
    // 1. Check existing
    const currentState = await this.checkPermission(scope, operation, resource);
    if (currentState === PermissionState.DENY) return false;
    if (currentState === PermissionState.ALWAYS_ALLOW || currentState === PermissionState.ALLOW_ONCE) return true;

    // 2. We are in ASK state. Send request to UI.
    const requestId = crypto.randomUUID();
    const canonicalResource = (scope === PermissionScope.FILE || scope === PermissionScope.DIRECTORY)
      ? getCanonicalPath(resource)
      : resource;

    const request: PermissionRequest = {
      id: requestId,
      scope,
      operation,
      resource: canonicalResource,
      reason
    };

    await this.repository.logAuditEvent({ action: 'REQUEST', request });

    try {
      const response = await this.uiBridge.requestUserPermission(request, 60000); // 60s timeout

      await this.repository.logAuditEvent({ action: 'RESPONSE', request, response });

      if (response.decision === PermissionState.ALWAYS_ALLOW || response.decision === PermissionState.DENY) {
        await this.repository.savePermission({
          id: crypto.randomUUID(),
          scope,
          operation,
          resource: canonicalResource,
          state: response.decision,
          createdAt: Date.now()
        });
      }

      return response.decision === PermissionState.ALWAYS_ALLOW || response.decision === PermissionState.ALLOW_ONCE;
    } catch (e: any) {
      await this.repository.logAuditEvent({ action: 'RESPONSE_FAILED', request, error: e.message });
      return false;
    }
  }

  private isResourceMatch(scope: PermissionScope, targetResource: string, grantedResource: string): boolean {
    if (scope === PermissionScope.DIRECTORY || scope === PermissionScope.FILE) {
      return isPathChildOf(targetResource, grantedResource);
    }
    // For exact matches (APP, GITHUB, etc)
    return targetResource === grantedResource;
  }
}
