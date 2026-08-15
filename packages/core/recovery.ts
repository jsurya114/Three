import * as fs from 'fs';
import * as path from 'path';

export interface JournalState {
  currentPhase: string;
  currentTask: string;
  overallProgress: string;
  nextAction: string;
}

export class RecoveryManager {
  private journalPath: string;

  constructor(workspaceRoot: string) {
    this.journalPath = path.join(workspaceRoot, 'journal.md');
  }

  public readState(): JournalState | null {
    if (!fs.existsSync(this.journalPath)) return null;

    const content = fs.readFileSync(this.journalPath, 'utf-8');
    
    // Very simple regex parsing for Phase 1 MVP
    const phaseMatch = content.match(/- Current phase:\s*(.*)/);
    const taskMatch = content.match(/- Current task:\s*(.*)/);
    const progressMatch = content.match(/- Overall progress:\s*(.*)/);
    const actionMatch = content.match(/- Next action:\s*(.*)/);

    if (phaseMatch && taskMatch) {
      return {
        currentPhase: phaseMatch[1],
        currentTask: taskMatch[1],
        overallProgress: progressMatch ? progressMatch[1] : '',
        nextAction: actionMatch ? actionMatch[1] : '',
      };
    }
    
    return null;
  }

  public writeState(state: JournalState): void {
    if (!fs.existsSync(this.journalPath)) {
      throw new Error('journal.md does not exist.');
    }

    let content = fs.readFileSync(this.journalPath, 'utf-8');
    
    // Replace state values in the Current State section
    content = content.replace(/- Current phase:\s*.*/, `- Current phase: ${state.currentPhase}`);
    content = content.replace(/- Current task:\s*.*/, `- Current task: ${state.currentTask}`);
    content = content.replace(/- Overall progress:\s*.*/, `- Overall progress: ${state.overallProgress}`);
    content = content.replace(/- Next action:\s*.*/, `- Next action: ${state.nextAction}`);

    fs.writeFileSync(this.journalPath, content, 'utf-8');
  }
}
