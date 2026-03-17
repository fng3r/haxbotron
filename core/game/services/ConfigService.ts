import { GameRoomConfig } from "../model/Configuration/GameRoomConfig";

/**
 * Service for managing configuration and admin password.
 */
export class ConfigService {
    private config: GameRoomConfig;
    private _adminPassword: string;

    constructor(config: GameRoomConfig, adminPassword: string) {
        this.config = config;
        this._adminPassword = adminPassword;
    }

    public getLaunchDate(): Date {
        return this.config._LaunchDate;
    }

    public getRUID(): string {
        return this.config._RUID;
    }

    public getRoomConfig(): RoomConfigObject {
        return this.config._config;
    }

    public getRoomName(): string {
        return this.config._config.roomName ?? "";
    }

    public getRoomToken(): string {
        return this.config._config.token!;
    }

    public getRoomPassword(): string | undefined {
        return this.config._config.password;
    }

    public getMaxPlayers(): number {
        return this.config._config.maxPlayers ?? 0;
    }

    public getSettings() {
        return this.config.settings;
    }

    public getRules() {
        return this.config.rules;
    }

    public getAdminPassword(): string {
        return this._adminPassword;
    }

    public setAdminPassword(password: string): void {
        this._adminPassword = password;
    }

    public setRoomPassword(password?: string): void {
        this.config._config.password = password;
    }
}
