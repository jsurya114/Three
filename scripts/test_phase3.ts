import { z } from 'zod';
import { ComputerActionSchema, getActionRiskLevel, RiskLevel } from '../packages/core/actions/schema';
import { ActionValidator } from '../packages/core/actions/ActionValidator';
import { ActionExecutor } from '../packages/core/actions/ActionExecutor';
import { PermissionManager } from '../packages/core/permission/PermissionManager';
import { JsonPermissionRepository } from '../packages/core/permission/JsonPermissionRepository';
import { BridgeClient } from '../packages/core/bridge/BridgeClient';
import { PlaywrightBrowserProvider } from '../packages/core/browser/PlaywrightBrowserProvider';
import { OllamaProvider } from '../packages/core/llm/OllamaProvider';
import * as path from 'path';
import * as os from 'os';
import * as fs from 'fs';

const TEST_DIR = path.join(os.homedir(), '.three', 'test_phase3');
const PERM_FILE = path.join(TEST_DIR, 'permissions.json');
const AUDIT_FILE = path.join(TEST_DIR, 'permissions_audit.jsonl');

async function runTests() {
  console.log("=== PHASE 3 TESTS STARTED ===");

  if (!fs.existsSync(TEST_DIR)) fs.mkdirSync(TEST_DIR, { recursive: true });

  const repo = new JsonPermissionRepository(TEST_DIR);
  const permissionManager = new PermissionManager(repo);
  const bridgeClient = new BridgeClient('http://127.0.0.1:18881');
  const browserProvider = new PlaywrightBrowserProvider();
  const ollamaProvider = new OllamaProvider();
  const actionValidator = new ActionValidator();
  const actionExecutor = new ActionExecutor(permissionManager, bridgeClient, browserProvider);

  // Initialize browser profiles
  await browserProvider.initialize([{ id: 'default', name: 'Default Profile', browser: 'chrome' }]);

  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, message: string) {
    if (condition) {
      console.log(`✅ PASS: ${message}`);
      passed++;
    } else {
      console.error(`❌ FAIL: ${message}`);
      failed++;
    }
  }

  // --- 1. SCHEMA VALIDATION TESTS ---
  console.log("\n--- Testing Schema Validation ---");
  try {
    const validJson = JSON.stringify([{ type: 'OPEN_APPLICATION', args: { name: 'Calculator' }, resource: 'Calculator', reason: 'Test' }]);
    const parsed = actionValidator.parseAndValidate(validJson);
    assert(parsed.length === 1 && parsed[0].type === 'OPEN_APPLICATION', "Valid action parsed correctly");
  } catch (e: any) { assert(false, `Valid action parsing failed: ${e.message}`); }

  try {
    const invalidJson = JSON.stringify([{ type: 'EXECUTE_SHELL', args: { command: 'rm -rf /' }, resource: 'shell', reason: 'Malicious' }]);
    actionValidator.parseAndValidate(invalidJson);
    assert(false, "Should have rejected unknown action type");
  } catch (e: any) {
    assert(e.message.includes('Action validation failed'), "Rejected unknown/arbitrary shell action correctly");
  }

  try {
    const malformedJson = `[{ type: "OPEN_APPLICATION"`; // missing bracket
    actionValidator.parseAndValidate(malformedJson);
    assert(false, "Should have rejected malformed JSON");
  } catch (e: any) {
    assert(e.message.includes('Action validation failed') || e.message.includes('Unexpected end of JSON input'), "Rejected malformed JSON");
  }

  // --- 2. RISK LEVELS ---
  console.log("\n--- Testing Risk Levels ---");
  assert(getActionRiskLevel('READ_FILE') === RiskLevel.MEDIUM, "READ_FILE is MEDIUM risk");
  assert(getActionRiskLevel('DELETE_FILE') === RiskLevel.CRITICAL, "DELETE_FILE is CRITICAL risk");

  // --- 3. PERMISSION ENFORCEMENT & PATH TRAVERSAL ---
  console.log("\n--- Testing Permission Enforcement & Path Traversal Protection ---");
  const traversalAction = {
    type: 'READ_FILE' as const,
    args: { path: '/tmp/../etc/passwd' },
    resource: '/tmp/../etc/passwd',
    reason: 'Read system file'
  };
  try {
    const reqs = actionValidator.getPermissionRequirements(traversalAction);
    const allowed = await permissionManager.requirePermission(reqs.scope, reqs.operation, reqs.resource, 'Test');
    assert(!allowed, "Permission Manager correctly denied path traversal by default");
  } catch (e: any) {
    assert(false, "Permission manager threw instead of denying");
  }

  // --- 4. BROWSER ABSTRACTION TESTS ---
  console.log("\n--- Testing Browser Abstraction (Playwright) ---");
  try {
    await browserProvider.openBrowser('default');
    assert(true, "Browser session opened successfully");
    
    await browserProvider.navigate('https://example.com');
    assert(true, "Browser navigated successfully");

    const pageData = await browserProvider.readPage();
    assert(pageData.title.includes('Example Domain'), `Page title read successfully: ${pageData.title}`);
    assert(pageData.textContent.includes('Example Domain'), "Safe DOM text read successfully");
  } catch (e: any) {
    assert(false, `Browser automation failed: ${e.message}`);
  } finally {
    await browserProvider.close();
  }

  // --- 5. OLLAMA STRUCTURED ACTION BENCHMARK ---
  console.log("\n--- Testing Ollama Structured Action Benchmark ---");
  try {
    const systemPrompt = `You are the Computer Agent Action Planner. Convert the request into a JSON array of ComputerAction objects.
Action types: OPEN_APPLICATION, CLOSE_APPLICATION, FOCUS_APPLICATION, IS_APPLICATION_RUNNING, LIST_APPLICATIONS, OPEN_FILE, OPEN_DIRECTORY, FIND_FILE, READ_FILE, CREATE_FILE, WRITE_FILE, MOVE_FILE, RENAME_FILE, DELETE_FILE, CLIPBOARD_READ, CLIPBOARD_WRITE, SCREENSHOT, BROWSER_OPEN, BROWSER_NAVIGATE, BROWSER_READ_PAGE, BROWSER_SEARCH, MEDIA_PLAY.
Each action must have: { "type": "...", "args": {}, "resource": "...", "reason": "..." }. Return ONLY the JSON array.`;
    
    const result = await ollamaProvider.generateStructuredCompletion([{ role: 'user', content: 'Open the Calculator app.' }], systemPrompt);
    const parsed = actionValidator.parseAndValidate(result);
    assert(parsed.length >= 1 && parsed[0].type === 'OPEN_APPLICATION' && parsed[0].args.name.toLowerCase().includes('calculator'), "Ollama successfully generated structured OPEN_APPLICATION action");
  } catch (e: any) {
    console.error(`Ollama Benchmark Failed (is Ollama running?): ${e.message}`);
    // We don't fail the entire suite if Ollama isn't running locally on the test machine, just record it.
  }

  console.log(`\n=== PHASE 3 TESTS COMPLETE ===`);
  console.log(`Passed: ${passed}`);
  console.log(`Failed: ${failed}`);

  if (failed > 0) {
    process.exit(1);
  }
}

runTests().catch(console.error);
