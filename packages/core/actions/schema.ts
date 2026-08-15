import { z } from 'zod';

export enum RiskLevel {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL'
}

export const ActionTypeEnum = z.enum([
  'OPEN_APPLICATION',
  'CLOSE_APPLICATION',
  'FOCUS_APPLICATION',
  'IS_APPLICATION_RUNNING',
  'LIST_APPLICATIONS',
  'OPEN_FILE',
  'OPEN_DIRECTORY',
  'FIND_FILE',
  'READ_FILE',
  'CREATE_FILE',
  'WRITE_FILE',
  'MOVE_FILE',
  'RENAME_FILE',
  'DELETE_FILE',
  'CLIPBOARD_READ',
  'CLIPBOARD_WRITE',
  'SCREENSHOT',
  'BROWSER_OPEN',
  'BROWSER_NAVIGATE',
  'BROWSER_READ_PAGE',
  'BROWSER_SEARCH',
  'MEDIA_PLAY'
]);

export const BaseActionSchema = z.object({
  id: z.string().uuid().optional(),
  type: ActionTypeEnum,
  args: z.record(z.string(), z.any()).default({}),
  resource: z.string(),
  reason: z.string(),
});

export const OpenApplicationAction = BaseActionSchema.extend({
  type: z.literal('OPEN_APPLICATION'),
  args: z.object({ name: z.string() })
});

export const CloseApplicationAction = BaseActionSchema.extend({
  type: z.literal('CLOSE_APPLICATION'),
  args: z.object({ name: z.string() })
});

export const FocusApplicationAction = BaseActionSchema.extend({
  type: z.literal('FOCUS_APPLICATION'),
  args: z.object({ name: z.string() })
});

export const IsApplicationRunningAction = BaseActionSchema.extend({
  type: z.literal('IS_APPLICATION_RUNNING'),
  args: z.object({ name: z.string() })
});

export const ListApplicationsAction = BaseActionSchema.extend({
  type: z.literal('LIST_APPLICATIONS'),
  args: z.object({})
});

export const OpenFileAction = BaseActionSchema.extend({
  type: z.literal('OPEN_FILE'),
  args: z.object({ path: z.string() })
});

export const OpenDirectoryAction = BaseActionSchema.extend({
  type: z.literal('OPEN_DIRECTORY'),
  args: z.object({ path: z.string() })
});

export const FindFileAction = BaseActionSchema.extend({
  type: z.literal('FIND_FILE'),
  args: z.object({ path: z.string(), pattern: z.string() })
});

export const ReadFileAction = BaseActionSchema.extend({
  type: z.literal('READ_FILE'),
  args: z.object({ path: z.string() })
});

export const CreateFileAction = BaseActionSchema.extend({
  type: z.literal('CREATE_FILE'),
  args: z.object({ path: z.string(), content: z.string().optional() })
});

export const WriteFileAction = BaseActionSchema.extend({
  type: z.literal('WRITE_FILE'),
  args: z.object({ path: z.string(), content: z.string() })
});

export const MoveFileAction = BaseActionSchema.extend({
  type: z.literal('MOVE_FILE'),
  args: z.object({ source: z.string(), destination: z.string() })
});

export const RenameFileAction = BaseActionSchema.extend({
  type: z.literal('RENAME_FILE'),
  args: z.object({ path: z.string(), newName: z.string() })
});

export const DeleteFileAction = BaseActionSchema.extend({
  type: z.literal('DELETE_FILE'),
  args: z.object({ path: z.string() })
});

export const ClipboardReadAction = BaseActionSchema.extend({
  type: z.literal('CLIPBOARD_READ'),
  args: z.object({})
});

export const ClipboardWriteAction = BaseActionSchema.extend({
  type: z.literal('CLIPBOARD_WRITE'),
  args: z.object({ text: z.string() })
});

export const ScreenshotAction = BaseActionSchema.extend({
  type: z.literal('SCREENSHOT'),
  args: z.object({ savePath: z.string() })
});

export const BrowserOpenAction = BaseActionSchema.extend({
  type: z.literal('BROWSER_OPEN'),
  args: z.object({ browser: z.enum(['chrome', 'brave', 'safari', 'default']).default('default'), profileId: z.string().optional() })
});

export const BrowserNavigateAction = BaseActionSchema.extend({
  type: z.literal('BROWSER_NAVIGATE'),
  args: z.object({ url: z.string() })
});

export const BrowserReadPageAction = BaseActionSchema.extend({
  type: z.literal('BROWSER_READ_PAGE'),
  args: z.object({})
});

export const BrowserSearchAction = BaseActionSchema.extend({
  type: z.literal('BROWSER_SEARCH'),
  args: z.object({ query: z.string() })
});

export const MediaPlayAction = BaseActionSchema.extend({
  type: z.literal('MEDIA_PLAY'),
  args: z.object({ query: z.string(), platform: z.enum(['spotify', 'youtube']).optional() })
});

export const ComputerActionSchema = z.discriminatedUnion('type', [
  OpenApplicationAction,
  CloseApplicationAction,
  FocusApplicationAction,
  IsApplicationRunningAction,
  ListApplicationsAction,
  OpenFileAction,
  OpenDirectoryAction,
  FindFileAction,
  ReadFileAction,
  CreateFileAction,
  WriteFileAction,
  MoveFileAction,
  RenameFileAction,
  DeleteFileAction,
  ClipboardReadAction,
  ClipboardWriteAction,
  ScreenshotAction,
  BrowserOpenAction,
  BrowserNavigateAction,
  BrowserReadPageAction,
  BrowserSearchAction,
  MediaPlayAction
]);

export type ComputerAction = z.infer<typeof ComputerActionSchema>;

export const ComputerActionArraySchema = z.array(ComputerActionSchema);

// Helper to determine risk level
export function getActionRiskLevel(type: string): RiskLevel {
  switch (type) {
    case 'LIST_APPLICATIONS':
    case 'IS_APPLICATION_RUNNING':
    case 'BROWSER_READ_PAGE':
    case 'CLIPBOARD_READ':
    case 'FIND_FILE':
      return RiskLevel.LOW;
      
    case 'OPEN_APPLICATION':
    case 'CLOSE_APPLICATION':
    case 'FOCUS_APPLICATION':
    case 'OPEN_FILE':
    case 'OPEN_DIRECTORY':
    case 'READ_FILE':
    case 'BROWSER_OPEN':
    case 'BROWSER_NAVIGATE':
    case 'BROWSER_SEARCH':
    case 'MEDIA_PLAY':
      return RiskLevel.MEDIUM;

    case 'CREATE_FILE':
    case 'WRITE_FILE':
    case 'RENAME_FILE':
    case 'MOVE_FILE':
    case 'CLIPBOARD_WRITE':
    case 'SCREENSHOT':
      return RiskLevel.HIGH;

    case 'DELETE_FILE':
      return RiskLevel.CRITICAL;

    default:
      return RiskLevel.HIGH; // safe fallback
  }
}
