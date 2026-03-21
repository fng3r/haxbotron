import { Player } from "../../game/model/GameObject/Player";
import { TeamID } from "../../game/model/GameObject/TeamID";
import { RoomInitConfig } from "./RoomHostConfig";
import { DiscordWebhookConfig } from "./RoomTypes";
import { RoomProcessManager } from "./RoomProcessManager";
import { RoomDetailInfo, RoomInfo, TeamColourInfo } from "./RoomProtocol";

export class RoomOperationsAPI {
    constructor(private readonly roomProcessManager: RoomProcessManager) {}

    public async openNewRoom(ruid: string, config: RoomInitConfig): Promise<void> {
        await this.roomProcessManager.openRoom(ruid, config);
    }

    public async closeRoom(ruid: string): Promise<void> {
        await this.roomProcessManager.closeRoom(ruid);
    }

    public checkExistRoom(ruid: string): boolean {
        return this.roomProcessManager.hasRoom(ruid);
    }

    public getExistRoomList(): string[] {
        return this.roomProcessManager.getAllRoomIds();
    }

    public getExistRoomNumber(): number {
        return this.roomProcessManager.getRoomCount();
    }

    public async getRoomLink(ruid: string): Promise<string> {
        return await this.roomProcessManager.requestRoom(ruid, "getRoomLink", undefined);
    }

    public async getRoomInfo(ruid: string): Promise<RoomInfo> {
        return await this.roomProcessManager.requestRoom(ruid, "getRoomInfo", undefined);
    }

    public async getRoomDetailInfo(ruid: string): Promise<RoomDetailInfo> {
        return await this.roomProcessManager.requestRoom(ruid, "getRoomDetailInfo", undefined);
    }

    public async getOnlinePlayersIDList(ruid: string): Promise<number[]> {
        return await this.roomProcessManager.requestRoom(ruid, "getOnlinePlayersIDList", undefined);
    }

    public async checkOnlinePlayer(ruid: string, id: number): Promise<boolean> {
        return await this.roomProcessManager.requestRoom(ruid, "checkOnlinePlayer", { id });
    }

    public async getPlayerInfo(ruid: string, id: number): Promise<Player | undefined> {
        return await this.roomProcessManager.requestRoom(ruid, "getPlayerInfo", { id });
    }

    public async banPlayerTemporarily(
        ruid: string,
        id: number,
        ban: boolean,
        reason: string,
        seconds: number
    ): Promise<void> {
        await this.roomProcessManager.requestRoom(ruid, "banPlayerTemporarily", { id, ban, reason, seconds });
    }

    public async broadcast(ruid: string, message: string): Promise<void> {
        await this.roomProcessManager.requestRoom(ruid, "broadcast", { message });
    }

    public async whisper(ruid: string, id: number, message: string): Promise<void> {
        await this.roomProcessManager.requestRoom(ruid, "whisper", { id, message });
    }

    public async getNotice(ruid: string): Promise<string | null> {
        return await this.roomProcessManager.requestRoom(ruid, "getNotice", undefined);
    }

    public async setNotice(ruid: string, message: string): Promise<void> {
        await this.roomProcessManager.requestRoom(ruid, "setNotice", { message });
    }

    public async setPassword(ruid: string, password: string): Promise<void> {
        await this.roomProcessManager.requestRoom(ruid, "setPassword", { password });
    }

    public async getChatFreeze(ruid: string): Promise<boolean> {
        return await this.roomProcessManager.requestRoom(ruid, "getChatFreeze", undefined);
    }

    public async setChatFreeze(ruid: string, freeze: boolean): Promise<void> {
        await this.roomProcessManager.requestRoom(ruid, "setChatFreeze", { freeze });
    }

    public async setPlayerMute(ruid: string, id: number, muteExpireTime: number): Promise<void> {
        await this.roomProcessManager.requestRoom(ruid, "setPlayerMute", { id, muteExpireTime });
    }

    public async setPlayerUnmute(ruid: string, id: number): Promise<void> {
        await this.roomProcessManager.requestRoom(ruid, "setPlayerUnmute", { id });
    }

    public async getTeamColours(ruid: string, team: TeamID): Promise<TeamColourInfo> {
        return await this.roomProcessManager.requestRoom(ruid, "getTeamColours", { team });
    }

    public async setTeamColours(
        ruid: string,
        team: TeamID,
        angle: number,
        textColour: number,
        teamColour1: number,
        teamColour2: number,
        teamColour3: number
    ): Promise<void> {
        await this.roomProcessManager.requestRoom(ruid, "setTeamColours", {
            team,
            angle,
            textColour,
            teamColour1,
            teamColour2,
            teamColour3,
        });
    }

    public async getDiscordWebhookConfig(ruid: string): Promise<DiscordWebhookConfig> {
        return await this.roomProcessManager.requestRoom(ruid, "getDiscordWebhookConfig", undefined);
    }

    public async setDiscordWebhookConfig(ruid: string, config: DiscordWebhookConfig): Promise<void> {
        await this.roomProcessManager.requestRoom(ruid, "setDiscordWebhookConfig", { config });
    }
}

export type { RoomDetailInfo, RoomInfo } from "./RoomProtocol";
