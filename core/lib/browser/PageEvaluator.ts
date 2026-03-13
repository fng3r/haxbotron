import { BrowserManager } from "./BrowserManager";

/**
 * Helper for executing code in browser page context.
 * Centralizes page evaluation logic to reduce duplication.
 */
export class PageEvaluator {
    constructor(private browserManager: BrowserManager) {}

    /**
     * Evaluate a function in the page context
     */
    public async evaluate<T>(
        ruid: string,
        pageFunction: () => T | Promise<T>
    ): Promise<T> {
        const page = this.browserManager.getPage(ruid);
        if (!page) {
            throw new Error(`[PageEvaluator] Page '${ruid}' does not exist`);
        }

        return await page.evaluate(pageFunction) as T;
    }

    /**
     * Evaluate a function with arguments in the page context
     */
    public async evaluateWithArgs<T>(
        ruid: string,
        pageFunction: (...args: any[]) => T | Promise<T>,
        ...args: any[]
    ): Promise<T> {
        const page = this.browserManager.getPage(ruid);
        if (!page) {
            throw new Error(`[PageEvaluator] Page '${ruid}' does not exist`);
        }

        return await page.evaluate(pageFunction, ...args) as T;
    }

    /**
     * Wait for a condition to be true in page context
     */
    public async waitForCondition(
        ruid: string,
        condition: () => boolean | Promise<boolean>,
        timeoutMs: number = 30000
    ): Promise<void> {
        const page = this.browserManager.getPage(ruid);
        if (!page) {
            throw new Error(`[PageEvaluator] Page '${ruid}' does not exist`);
        }

        await page.waitForFunction(condition, { timeout: timeoutMs });
    }

    /**
     * Add script tag to page
     */
    public async addScriptTag(
        ruid: string,
        options: { path?: string; content?: string; url?: string }
    ): Promise<void> {
        const page = this.browserManager.getPage(ruid);
        if (!page) {
            throw new Error(`[PageEvaluator] Page '${ruid}' does not exist`);
        }

        await page.addScriptTag(options);
    }
}
