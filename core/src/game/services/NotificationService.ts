/**
 * Service for managing notices and announcements
 */
export class NotificationService {
    private notice: string = '';

    public getNotice(): string {
        return this.notice;
    }

    public setNotice(notice: string): void {
        this.notice = notice;
    }

    public clearNotice(): void {
        this.notice = '';
    }

    public hasNotice(): boolean {
        return this.notice !== '';
    }
}
