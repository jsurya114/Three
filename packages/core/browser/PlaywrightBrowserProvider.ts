import { chromium, Browser, BrowserContext, Page } from 'playwright';
import { BrowserProvider, BrowserProfile } from './BrowserProvider';

export class PlaywrightBrowserProvider implements BrowserProvider {
  private browser: Browser | null = null;
  private context: BrowserContext | null = null;
  private page: Page | null = null;
  private profiles: Map<string, BrowserProfile> = new Map();
  private activeProfileId: string | null = null;

  async initialize(profiles: BrowserProfile[]): Promise<void> {
    for (const p of profiles) {
      this.profiles.set(p.id, p);
    }
  }

  async openBrowser(profileId?: string): Promise<void> {
    if (this.browser) return;

    if (profileId && !this.profiles.has(profileId)) {
      throw new Error(`Profile ${profileId} not found`);
    }

    this.activeProfileId = profileId || null;
    
    // For MVP Phase 3, we launch a standard Chromium instance.
    // Real user-profile injection requires userDataDir with PersistentContext,
    // but the prompt specified keeping secrets isolated and only safe metadata.
    // For now we just use a generic headless/headed instance.
    this.browser = await chromium.launch({ headless: false });
    this.context = await this.browser.newContext();
    this.page = await this.context.newPage();
  }

  async navigate(url: string): Promise<void> {
    if (!this.page) await this.openBrowser();
    
    let targetUrl = url;
    if (!targetUrl.startsWith('http://') && !targetUrl.startsWith('https://')) {
      targetUrl = 'https://' + targetUrl;
    }
    
    await this.page!.goto(targetUrl, { waitUntil: 'domcontentloaded' });
  }

  async readPage(): Promise<{ title: string, url: string, textContent: string }> {
    if (!this.page) throw new Error("Browser is not open");
    
    const title = await this.page.title();
    const url = this.page.url();
    // Safely extract text content without executing arbitrary JS from LLM
    const textContent = await this.page.evaluate(() => document.body.innerText.substring(0, 5000));
    
    return { title, url, textContent };
  }

  async search(query: string): Promise<void> {
    if (!this.page) await this.openBrowser();
    const searchUrl = `https://www.google.com/search?q=${encodeURIComponent(query)}`;
    await this.page!.goto(searchUrl, { waitUntil: 'domcontentloaded' });
  }

  async close(): Promise<void> {
    if (this.page) await this.page.close();
    if (this.context) await this.context.close();
    if (this.browser) await this.browser.close();
    
    this.page = null;
    this.context = null;
    this.browser = null;
    this.activeProfileId = null;
  }
}
