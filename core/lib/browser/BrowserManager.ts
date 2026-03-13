import puppeteer from "puppeteer";
import { Server as SIOserver } from "socket.io";
import { winstonLogger } from "../../winstonLoggerSystem";

/**
 * Core browser lifecycle and page management.
 * Manages Puppeteer browser instance and page container.
 */
export class BrowserManager {
    private static instance: BrowserManager;
    
    private browser: puppeteer.Browser | undefined;
    private pages: Map<string, puppeteer.Page> = new Map();
    private sioServer: SIOserver | undefined;

    private constructor() {}

    public static getInstance(): BrowserManager {
        if (!this.instance) {
            this.instance = new BrowserManager();
        }
        return this.instance;
    }

    /**
     * Initialize Puppeteer browser
     */
    public async initialize(): Promise<void> {
        if (this.browser) {
            winstonLogger.warn("[BrowserManager] Browser already initialized");
            return;
        }

        const browserSettings = {
            customArgs: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-features=WebRtcHideLocalIpsWithMdns'],
            openHeadless: true
        };

        if (process.env.TWEAKS_HEADLESSMODE && JSON.parse(process.env.TWEAKS_HEADLESSMODE.toLowerCase()) === false) {
            browserSettings.openHeadless = false;
        }

        winstonLogger.info("[BrowserManager] Launching browser...");
        this.browser = await puppeteer.launch({ 
            headless: browserSettings.openHeadless, 
            args: browserSettings.customArgs 
        });

        this.browser.on('disconnected', () => {
            winstonLogger.info("[BrowserManager] Browser disconnected");
            this.browser?.close();
            this.browser = undefined;
        });

        winstonLogger.info("[BrowserManager] Browser launched successfully");
    }

    /**
     * Shutdown browser and cleanup
     */
    public async shutdown(): Promise<void> {
        if (!this.browser) {
            return;
        }

        winstonLogger.info("[BrowserManager] Shutting down browser...");
        
        // Close all pages first
        for (const [ruid, page] of this.pages.entries()) {
            await page.close();
            this.pages.delete(ruid);
        }

        await this.browser.close();
        this.browser = undefined;
        
        winstonLogger.info("[BrowserManager] Browser shutdown complete");
    }

    /**
     * Create a new page
     */
    public async createPage(ruid: string): Promise<puppeteer.Page> {
        if (!this.browser) {
            throw new Error("[BrowserManager] Browser not initialized. Call initialize() first.");
        }

        if (this.pages.has(ruid)) {
            throw new Error(`[BrowserManager] Page '${ruid}' already exists`);
        }

        const page = await this.browser.newPage();
        this.pages.set(ruid, page);
        
        winstonLogger.info(`[BrowserManager] Created page: ${ruid}`);
        return page;
    }

    /**
     * Close a page
     */
    public async closePage(ruid: string): Promise<void> {
        const page = this.pages.get(ruid);
        if (!page) {
            throw new Error(`[BrowserManager] Page '${ruid}' does not exist`);
        }

        await page.close();
        this.pages.delete(ruid);
        
        winstonLogger.info(`[BrowserManager] Closed page: ${ruid}`);
    }

    /**
     * Get a page by RUID
     */
    public getPage(ruid: string): puppeteer.Page | undefined {
        return this.pages.get(ruid);
    }

    /**
     * Check if page exists
     */
    public hasPage(ruid: string): boolean {
        return this.pages.has(ruid);
    }

    /**
     * Get all page RUIDs
     */
    public getAllPageIds(): string[] {
        return Array.from(this.pages.keys());
    }

    /**
     * Get number of pages
     */
    public getPageCount(): number {
        return this.pages.size;
    }

    /**
     * Get all pages (for internal use)
     */
    public async getAllPages(): Promise<puppeteer.Page[]> {
        if (!this.browser) {
            return [];
        }
        return await this.browser.pages();
    }

    /**
     * Attach Socket.IO server
     */
    public attachSocketIOServer(server: SIOserver): void {
        this.sioServer = server;
        winstonLogger.info("[BrowserManager] Socket.IO server attached");
    }

    /**
     * Emit Socket.IO event
     */
    public emitSocketIOEvent(event: string, data: any): void {
        this.sioServer?.sockets.emit(event, data);
    }

    /**
     * Get browser instance (for advanced use cases)
     */
    public getBrowser(): puppeteer.Browser | undefined {
        return this.browser;
    }
}
