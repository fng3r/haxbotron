import { GameRoomConfig } from "../model/Configuration/GameRoomConfig";

/**
 * Service for managing configuration, admin password, and banned words
 */
export class ConfigService {
    private config: GameRoomConfig;
    private _adminPassword: string;
    private bannedWordsPool: {
        nickname: string[];
        chat: string[];
    };

    constructor(config: GameRoomConfig, adminPassword: string) {
        this.config = config;
        this._adminPassword = adminPassword;
        this.bannedWordsPool = {
            nickname: [],
            chat: []
        };
    }

    public getConfig(): GameRoomConfig {
        return this.config;
    }

    public getRUID(): string {
        return this.config._RUID;
    }

    public getAdminPassword(): string {
        return this._adminPassword;
    }

    public setAdminPassword(password: string): void {
        this._adminPassword = password;
    }

    public getBannedWords(type: 'nickname' | 'chat'): string[] {
        return this.bannedWordsPool[type];
    }

    public setBannedWords(type: 'nickname' | 'chat', words: string[]): void {
        this.bannedWordsPool[type] = words;
    }

    public addBannedWord(type: 'nickname' | 'chat', word: string): void {
        if (!this.bannedWordsPool[type].includes(word)) {
            this.bannedWordsPool[type].push(word);
        }
    }

    public removeBannedWord(type: 'nickname' | 'chat', word: string): void {
        const index = this.bannedWordsPool[type].indexOf(word);
        if (index !== -1) {
            this.bannedWordsPool[type].splice(index, 1);
        }
    }

    public isBannedWord(type: 'nickname' | 'chat', word: string): boolean {
        return this.bannedWordsPool[type].includes(word);
    }
}
