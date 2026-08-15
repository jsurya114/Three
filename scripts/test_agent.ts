import { ComputerAgent } from '../agents/computer/index';
import { PermissionManager } from '../packages/core/permission/PermissionManager';
import { JsonPermissionRepository } from '../packages/core/permission/JsonPermissionRepository';
import { WebSocketUIBridge } from '../packages/core/permission/UIBridge';
import { BridgeClient } from '../packages/core/bridge/BridgeClient';
import * as os from 'os';
import * as path from 'path';
import * as fs from 'fs';

async function testPhase1() {
  console.log('Testing Computer Agent Native Execution...');

  const workspace = path.join(os.homedir(), '.three');
  if (!fs.existsSync(workspace)) fs.mkdirSync(workspace, { recursive: true });
  
  const repo = new JsonPermissionRepository(workspace);
  const uiBridge = new WebSocketUIBridge(18884);
  const bridgeClient = new BridgeClient(18881);
  const pm = new PermissionManager(repo, uiBridge);

  // Auto-allow all for Phase 1 end-to-end testing
  pm.requirePermission = async (scope, op, resource, reason) => {
    console.log(`[Permission Requested] ${op} on ${resource}`);
    return true; // Auto-allow
  };

  const agent = new ComputerAgent(pm, bridgeClient);
  await agent.initialize();

  // Test Application
  console.log('Opening Application...');
  const context = { sessionId: 'test', userId: 'test' };

  console.log("Opening Application...");
  console.log(await agent.execute(JSON.stringify([{ type: 'OPEN_APPLICATION', args: { name: 'Calculator' }, resource: 'Calculator', reason: 'Test' }]), context));

  console.log("Opening Folder...");
  console.log(await agent.execute(JSON.stringify([{ type: 'OPEN_DIRECTORY', args: { path: '/tmp' }, resource: '/tmp', reason: 'Test' }]), context));

  console.log("Opening File...");
  console.log(await agent.execute(JSON.stringify([{ type: 'OPEN_FILE', args: { path: '/etc/hosts' }, resource: '/etc/hosts', reason: 'Test' }]), context));

  console.log("Setting Clipboard...");
  console.log(await agent.execute(JSON.stringify([{ type: 'CLIPBOARD_WRITE', args: { text: 'Hello from Three Agent' }, resource: 'clipboard', reason: 'Test' }]), context));

  console.log("Getting Clipboard...");
  console.log(await agent.execute(JSON.stringify([{ type: 'CLIPBOARD_READ', args: {}, resource: 'clipboard', reason: 'Test' }]), context));

  console.log("Taking Screenshot...");
  console.log(await agent.execute(JSON.stringify([{ type: 'SCREENSHOT', args: { savePath: '/tmp/test_shot.png' }, resource: 'screen', reason: 'Test' }]), context));

  console.log("Closing Application...");
  console.log(await agent.execute(JSON.stringify([{ type: 'CLOSE_APPLICATION', args: { name: 'Calculator' }, resource: 'Calculator', reason: 'Test' }]), context));

  console.log('Tests complete!');
}

testPhase1().catch(console.error);
