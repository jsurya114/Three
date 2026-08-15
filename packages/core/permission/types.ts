export enum PermissionScope {
  FILE = 'FILE',
  DIRECTORY = 'DIRECTORY',
  APPLICATION = 'APPLICATION',
  EMAIL_ACCOUNT = 'EMAIL_ACCOUNT',
  GITHUB_REPOSITORY = 'GITHUB_REPOSITORY',
  BROWSER_PROFILE = 'BROWSER_PROFILE',
  TOOL = 'TOOL',
  SYSTEM_ACTION = 'SYSTEM_ACTION'
}

export enum PermissionOperation {
  // FILE operations
  FILE_READ = 'FILE.READ',
  FILE_WRITE = 'FILE.WRITE',
  FILE_DELETE = 'FILE.DELETE',
  
  // DIRECTORY operations
  DIRECTORY_READ = 'DIRECTORY.READ',
  DIRECTORY_WRITE = 'DIRECTORY.WRITE',
  DIRECTORY_DELETE = 'DIRECTORY.DELETE',

  // APPLICATION operations
  APPLICATION_OPEN = 'APPLICATION.OPEN',
  APPLICATION_CLOSE = 'APPLICATION.CLOSE',

  // SYSTEM operations
  CLIPBOARD_READ = 'CLIPBOARD.READ',
  CLIPBOARD_WRITE = 'CLIPBOARD.WRITE',
  SCREENSHOT_CAPTURE = 'SCREENSHOT.CAPTURE',

  // EMAIL operations
  EMAIL_READ = 'EMAIL.READ',
  EMAIL_DRAFT = 'EMAIL.DRAFT',
  EMAIL_SEND = 'EMAIL.SEND',

  // GITHUB operations
  GITHUB_READ = 'GITHUB.READ',
  GITHUB_MODIFY = 'GITHUB.MODIFY',
  GITHUB_PUSH = 'GITHUB.PUSH',
  GITHUB_DELETE = 'GITHUB.DELETE',

  // JOB operations
  JOB_APPLICATION_SUBMIT = 'JOB.APPLICATION.SUBMIT'
}

export enum PermissionState {
  ALLOW_ONCE = 'ALLOW_ONCE',
  ALWAYS_ALLOW = 'ALWAYS_ALLOW',
  DENY = 'DENY',
  ASK = 'ASK' // Used for evaluation state
}

export interface PermissionRecord {
  id: string; // unique ID
  scope: PermissionScope;
  operation: PermissionOperation;
  resource: string; // The specific resource (e.g., path, app name)
  state: PermissionState; // Only ALLOW_ONCE, ALWAYS_ALLOW, DENY
  createdAt: number;
  expiresAt?: number;
}

export interface PermissionRequest {
  id: string;
  scope: PermissionScope;
  operation: PermissionOperation;
  resource: string;
  reason: string;
}

export interface PermissionResponse {
  requestId: string;
  decision: PermissionState; // User's choice from UI
}
