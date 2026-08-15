import { RecoveryManager } from '../packages/core/recovery';
import * as path from 'path';

function run() {
  const root = path.join(__dirname, '..');
  const rm = new RecoveryManager(root);

  console.log('--- Simulating Task Start ---');
  const initialState = rm.readState();
  console.log('Original Task:', initialState?.currentTask);

  // Update journal to simulate task state persisted
  const newTaskState = {
    currentPhase: 'Phase 1 - Acceptance Verification',
    currentTask: 'Testing journal recovery mechanism (in-progress)',
    overallProgress: 'End-to-end testing',
    nextAction: 'Complete recovery test'
  };
  rm.writeState(newTaskState);
  console.log('Task state persisted to journal.md.');

  console.log('\n--- Simulating Interruption & Restart ---');
  // Read state again (as if a new process started)
  const recoveredState = rm.readState();
  console.log('Recovered Phase:', recoveredState?.currentPhase);
  console.log('Recovered Task:', recoveredState?.currentTask);
  console.log('Recovered Action:', recoveredState?.nextAction);

  if (recoveredState?.currentTask === 'Testing journal recovery mechanism (in-progress)') {
    console.log('SUCCESS: Identified the last incomplete task. Resuming task...');
    
    // Complete the task
    const completedState = {
      currentPhase: 'Phase 1 - Acceptance Verification',
      currentTask: 'Verifying OpenClaw, Ollama, Computer Agent, Tauri, and Recovery mechanisms.',
      overallProgress: 'Phase 1 foundations built. Currently verifying end-to-end integration and acceptance criteria.',
      nextAction: 'Execute Phase 1 acceptance tests.'
    };
    rm.writeState(completedState);
    console.log('Task resumed and completed, journal restored to previous state.');
  } else {
    console.error('FAILED to recover task.');
  }
}

run();
