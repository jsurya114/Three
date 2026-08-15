import * as fs from 'fs';
import * as path from 'path';

/**
 * Ensures the path is canonical and prevents path traversal or symlink escapes.
 * Resolves all symlinks and '..' and ensures it exists or its parent exists.
 * @param unsafePath The user or agent provided path
 * @returns The resolved canonical path
 * @throws Error if the path attempts traversal outside allowed areas or is invalid
 */
export function getCanonicalPath(unsafePath: string): string {
  // 1. Resolve to absolute path
  let absolutePath = path.resolve(unsafePath);

  // 2. Check if the path exists to fully resolve symlinks
  try {
    let current = absolutePath;
    let missingParts: string[] = [];
    
    while (!fs.existsSync(current) && current !== path.parse(current).root) {
      missingParts.unshift(path.basename(current));
      current = path.dirname(current);
    }
    
    if (fs.existsSync(current)) {
      current = fs.realpathSync(current);
    }
    
    absolutePath = path.join(current, ...missingParts);
  } catch (e: any) {
    throw new Error(`Path validation failed: ${e.message}`);
  }

  // 3. Ensure no trailing slashes for exact matching (unless it's the root '/')
  if (absolutePath.length > 1 && absolutePath.endsWith('/')) {
    absolutePath = absolutePath.slice(0, -1);
  }

  return absolutePath;
}

/**
 * Checks if a target path is a child of or equal to a parent path.
 */
export function isPathChildOf(target: string, parent: string): boolean {
  const canonicalTarget = getCanonicalPath(target);
  const canonicalParent = getCanonicalPath(parent);

  if (canonicalTarget === canonicalParent) return true;
  
  // ensure boundary (e.g. /Downloads-secret is not a child of /Downloads)
  return canonicalTarget.startsWith(canonicalParent + path.sep);
}
