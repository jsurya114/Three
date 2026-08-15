import { PermissionManager } from '../packages/core/permission/PermissionManager';
import { JsonPermissionRepository } from '../packages/core/permission/JsonPermissionRepository';
import { WebSocketUIBridge } from '../packages/core/permission/UIBridge';
import { PermissionScope, PermissionOperation, PermissionState } from '../packages/core/permission/types';
import { WebSocket } from 'ws';
import * as os from 'os';
import * as path from 'path';
import * as fs from 'fs';
import * as crypto from 'crypto';

// Setup test environment
const TEST_WORKSPACE = path.join(os.tmpdir(), `three-test-${crypto.randomUUID()}`);
fs.mkdirSync(TEST_WORKSPACE, { recursive: true });

async function runTests() {
  console.log(`Starting Permission Manager tests in ${TEST_WORKSPACE}`);
  
  const repo = new JsonPermissionRepository(TEST_WORKSPACE);
  const uiBridge = new WebSocketUIBridge(18883); // Test port
  const pm = new PermissionManager(repo, uiBridge);

  // 1. WebSocket Test UI Client
  await uiBridge.start();
  const token = fs.readFileSync(path.join(os.homedir(), '.three', 'ws_token'), 'utf-8');
  
  const wsClient = new WebSocket('ws://127.0.0.1:18883');
  
  // Define a mock auto-responder for the UI
  let autoResponse: PermissionState | null = null;
  
  await new Promise<void>((resolve) => {
    wsClient.on('open', () => {
      wsClient.send(JSON.stringify({ type: 'auth', token }));
    });
    wsClient.on('message', (data: any) => {
      const msg = JSON.parse(data.toString());
      if (msg.type === 'auth_success') resolve();
      if (msg.type === 'permission_request' && autoResponse) {
        wsClient.send(JSON.stringify({
          type: 'permission_response',
          response: { requestId: msg.request.id, decision: autoResponse }
        }));
      }
    });
  });

  // TEST 1: No permission -> ASK (UI handles and returns ALLOW_ONCE)
  autoResponse = PermissionState.ALLOW_ONCE;
  let allowed = await pm.requirePermission(PermissionScope.FILE, PermissionOperation.FILE_READ, '/tmp/test.txt', 'test');
  if (!allowed) throw new Error('Test 1 failed: should allow once');

  // TEST 2: Allow Once is consumed -> next request must ask again
  autoResponse = PermissionState.DENY; // if it doesn't ask, it would bypass this
  allowed = await pm.requirePermission(PermissionScope.FILE, PermissionOperation.FILE_READ, '/tmp/test.txt', 'test 2');
  if (allowed) throw new Error('Test 2 failed: Allow once should not persist');

  // TEST 3: Always Allow
  autoResponse = PermissionState.ALWAYS_ALLOW;
  await pm.requirePermission(PermissionScope.FILE, PermissionOperation.FILE_READ, '/tmp/always.txt', 'always');
  autoResponse = PermissionState.DENY; // UI should not be invoked now
  allowed = await pm.requirePermission(PermissionScope.FILE, PermissionOperation.FILE_READ, '/tmp/always.txt', 'always 2');
  if (!allowed) throw new Error('Test 3 failed: Always Allow should bypass UI');

  // TEST 4: Deny
  autoResponse = PermissionState.DENY;
  allowed = await pm.requirePermission(PermissionScope.FILE, PermissionOperation.FILE_READ, '/tmp/deny.txt', 'deny');
  if (allowed) throw new Error('Test 4 failed: Deny should block');
  autoResponse = PermissionState.ALLOW_ONCE; // Should not be invoked, cached DENY
  allowed = await pm.requirePermission(PermissionScope.FILE, PermissionOperation.FILE_READ, '/tmp/deny.txt', 'deny 2');
  if (allowed) throw new Error('Test 4 failed: Cached deny should block');

  // TEST 5: Revoke
  const perms = await repo.getAllPermissions();
  const alwaysPerm = perms.find(p => p.resource.endsWith('always.txt'));
  if (alwaysPerm) {
    await repo.revokePermission(alwaysPerm.id);
  }
  autoResponse = PermissionState.DENY;
  allowed = await pm.requirePermission(PermissionScope.FILE, PermissionOperation.FILE_READ, '/tmp/always.txt', 'revoked');
  if (allowed) throw new Error('Test 5 failed: Revoked permission should not allow');

  // TEST 6: Directory inheritance
  autoResponse = PermissionState.ALWAYS_ALLOW;
  await pm.requirePermission(PermissionScope.DIRECTORY, PermissionOperation.DIRECTORY_READ, '/tmp/testdir', 'dir allow');
  autoResponse = PermissionState.DENY;
  allowed = await pm.requirePermission(PermissionScope.FILE, PermissionOperation.FILE_READ, '/tmp/testdir/child.txt', 'child');
  if (!allowed) throw new Error('Test 6 failed: Directory inheritance');

  // TEST 7: Sibling directory rejection
  allowed = await pm.requirePermission(PermissionScope.FILE, PermissionOperation.FILE_READ, '/tmp/testdir-sibling', 'sibling');
  if (allowed) throw new Error('Test 7 failed: Sibling should be rejected');

  // TEST 8: Operation separation (READ != WRITE)
  allowed = await pm.requirePermission(PermissionScope.DIRECTORY, PermissionOperation.DIRECTORY_WRITE, '/tmp/testdir', 'write');
  if (allowed) throw new Error('Test 8 failed: Read does not grant Write');

  // TEST 9: Restart persistence
  const repo2 = new JsonPermissionRepository(TEST_WORKSPACE);
  const pm2 = new PermissionManager(repo2, uiBridge);
  allowed = await pm2.requirePermission(PermissionScope.DIRECTORY, PermissionOperation.DIRECTORY_READ, '/tmp/testdir', 'persisted');
  if (!allowed) throw new Error('Test 9 failed: Restart persistence');

  // Cleanup
  wsClient.close();
  await uiBridge.stop();
  fs.rmSync(TEST_WORKSPACE, { recursive: true, force: true });
  console.log('All tests passed!');
}

runTests().catch(e => {
  console.error(e);
  process.exit(1);
});
