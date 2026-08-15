export interface BrowserProfile {
  id: string;
  name: string;
  browser: 'chrome' | 'brave' | 'safari' | 'default';
  dataPath?: string;
}

export interface BrowserProvider {
  /**
   * Initializes the browser provider with the given profiles.
   */
  initialize(profiles: BrowserProfile[]): Promise<void>;

  /**
   * Opens the browser, mapping to the user's defined profile mapping.
   */
  openBrowser(profileId?: string): Promise<void>;

  /**
   * Navigates to a specific URL in the current active session.
   */
  navigate(url: string): Promise<void>;

  /**
   * Reads the current page content and title safely.
   */
  readPage(): Promise<{ title: string, url: string, textContent: string }>;

  /**
   * Searches for a query using the default search engine.
   */
  search(query: string): Promise<void>;
  
  /**
   * Cleans up browser resources.
   */
  close(): Promise<void>;
}
