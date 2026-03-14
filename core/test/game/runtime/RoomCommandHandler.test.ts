/// <reference types="jest" />

import { describe, expect, it, jest, beforeEach } from "@jest/globals";
import { TeamID } from "../../../game/model/GameObject/TeamID";
import { handleRoomCommand } from "../../../game/runtime/RoomCommandHandler";
import { RoomRuntime } from "../../../game/runtime/RoomRuntime";
import { RuntimeRoomRpcCommand, RuntimeRoomRpcRequest } from "../../../lib/room/RoomProtocol";

jest.mock("../../../game/runtime/WorkerEventBridge", () => ({
    emitPlayerStatusChange: jest.fn(),
}));

const { emitPlayerStatusChange } = jest.requireMock("../../../game/runtime/WorkerEventBridge") as {
    emitPlayerStatusChange: jest.Mock;
};

type MockRoomRuntime = RoomRuntime & {
    config: {
        getConfig: jest.Mock;
        getAdminPassword: jest.Mock;
        setRoomPassword: jest.Mock;
    };
    room: {
        getRoom: jest.Mock;
        getLink: jest.Mock;
        setPassword: jest.Mock;
        setTeamColours: jest.Mock;
        getTeamColours: jest.Mock;
        sendAnnouncement: jest.Mock;
    };
    player: {
        getPlayerCount: jest.Mock;
        getPlayerList: jest.Mock;
    };
    ban: {
        createTemporaryBan: jest.Mock;
        upsertBan: jest.Mock;
    };
    chat: {
        isAllMuted: jest.Mock;
        setAllMuted: jest.Mock;
    };
    social: {
        getDiscordWebhookConfig: jest.Mock;
        updateDiscordWebhookConfig: jest.Mock;
    };
    notification: {
        getNotice: jest.Mock;
        setNotice: jest.Mock;
    };
    logger: {
        i: jest.Mock;
        w: jest.Mock;
        e: jest.Mock;
    };
};

function createRequest<C extends RuntimeRoomRpcCommand>(
    command: C,
    payload: RuntimeRoomRpcRequest<C>["payload"]
): RuntimeRoomRpcRequest<C> {
    return {
        type: "request",
        requestId: "test-request",
        command,
        payload,
    };
}

function createRuntime() {
    const player = {
        id: 7,
        name: "Alice",
        conn: "conn-7",
        auth: "auth-7",
        permissions: {
            mute: false,
            muteExpire: -1,
        },
    };
    const secondPlayer = {
        id: 8,
        name: "Bob",
        conn: "conn-8",
        auth: "auth-8",
        permissions: {
            mute: false,
            muteExpire: -1,
        },
    };
    const playerList = new Map<number, typeof player>([
        [player.id, player],
        [secondPlayer.id, secondPlayer],
    ]);
    const nativeRoom = {
        stopRecording: jest.fn(),
        kickPlayer: jest.fn(),
        setTeamColors: jest.fn(),
    };
    const configValue = {
        _config: { roomName: "Phase 3 Room" },
        settings: { chatFloodCriterion: 5 },
        rules: { fairPlay: true },
    };
    const banItem = { id: "ban-1" };
    const webhookConfig = {
        feed: true,
        replayUpload: true,
        replaysWebhookId: "replay-id",
        replaysWebhookToken: "replay-token",
        passwordWebhookId: "password-id",
        passwordWebhookToken: "password-token",
    };

    const runtime = {
        config: {
            getConfig: jest.fn().mockReturnValue(configValue),
            getAdminPassword: jest.fn().mockReturnValue("admin-secret"),
            setRoomPassword: jest.fn(),
        },
        room: {
            getRoom: jest.fn().mockReturnValue(nativeRoom),
            getLink: jest.fn().mockReturnValue("https://example.com/room"),
            setPassword: jest.fn(),
            setTeamColours: jest.fn(),
            getTeamColours: jest.fn().mockReturnValue({
                red: {
                    angle: 0,
                    textColour: 0xffffff,
                    teamColour1: 0xe66e55,
                    teamColour2: 0xe66e55,
                    teamColour3: 0xe66e55,
                },
                blue: {
                    angle: 0,
                    textColour: 0xffffff,
                    teamColour1: 0x5a89e5,
                    teamColour2: 0x5a89e5,
                    teamColour3: 0x5a89e5,
                },
            }),
            sendAnnouncement: jest.fn(),
        },
        player: {
            getPlayerCount: jest.fn().mockReturnValue(playerList.size),
            getPlayerList: jest.fn().mockReturnValue(playerList),
        },
        playerRole: {},
        playerOnboarding: {},
        match: {},
        ban: {
            createTemporaryBan: jest.fn().mockReturnValue(banItem),
            upsertBan: jest.fn(async () => undefined),
        },
        chat: {
            isAllMuted: jest.fn().mockReturnValue(false),
            setAllMuted: jest.fn(),
        },
        social: {
            getDiscordWebhookConfig: jest.fn().mockReturnValue(webhookConfig),
            updateDiscordWebhookConfig: jest.fn(),
        },
        notification: {
            getNotice: jest.fn().mockReturnValue("notice"),
            setNotice: jest.fn(),
        },
        logger: {
            i: jest.fn(),
            w: jest.fn(),
            e: jest.fn(),
        },
    } as unknown as MockRoomRuntime;

    return { runtime, nativeRoom, playerList, player, secondPlayer, banItem, webhookConfig };
}

describe("RoomCommandHandler", () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it("handles closeRoom", async () => {
        const { runtime, nativeRoom } = createRuntime();

        await expect(handleRoomCommand(runtime, createRequest("closeRoom", undefined))).resolves.toBeUndefined();

        expect(nativeRoom.stopRecording).toHaveBeenCalledTimes(1);
    });

    it("handles getRoomLink", async () => {
        const { runtime } = createRuntime();

        await expect(handleRoomCommand(runtime, createRequest("getRoomLink", undefined))).resolves.toBe(
            "https://example.com/room"
        );
    });

    it("handles getRoomInfo", async () => {
        const { runtime } = createRuntime();

        await expect(handleRoomCommand(runtime, createRequest("getRoomInfo", undefined))).resolves.toEqual({
            roomName: "Phase 3 Room",
            onlinePlayers: 2,
        });
    });

    it("handles getRoomDetailInfo", async () => {
        const { runtime } = createRuntime();

        await expect(handleRoomCommand(runtime, createRequest("getRoomDetailInfo", undefined))).resolves.toEqual({
            roomName: "Phase 3 Room",
            onlinePlayers: 2,
            adminPassword: "admin-secret",
            link: "https://example.com/room",
            _roomConfig: { roomName: "Phase 3 Room" },
            botSettings: { chatFloodCriterion: 5 },
            rules: { fairPlay: true },
        });
    });

    it("handles getOnlinePlayersIDList", async () => {
        const { runtime } = createRuntime();

        await expect(handleRoomCommand(runtime, createRequest("getOnlinePlayersIDList", undefined))).resolves.toEqual([
            7,
            8,
        ]);
    });

    it("handles checkOnlinePlayer", async () => {
        const { runtime } = createRuntime();

        await expect(handleRoomCommand(runtime, createRequest("checkOnlinePlayer", { id: 7 }))).resolves.toBe(true);
        await expect(handleRoomCommand(runtime, createRequest("checkOnlinePlayer", { id: 99 }))).resolves.toBe(false);
    });

    it("handles getPlayerInfo", async () => {
        const { runtime, player } = createRuntime();

        await expect(handleRoomCommand(runtime, createRequest("getPlayerInfo", { id: 7 }))).resolves.toBe(player);
        await expect(handleRoomCommand(runtime, createRequest("getPlayerInfo", { id: 99 }))).resolves.toBeUndefined();
    });

    it("handles banPlayerTemporarily for online players", async () => {
        const { runtime, nativeRoom, player, banItem } = createRuntime();

        await expect(
            handleRoomCommand(
                runtime,
                createRequest("banPlayerTemporarily", { id: 7, ban: true, reason: "spam", seconds: 30 })
            )
        ).resolves.toBeUndefined();

        expect(runtime.ban.createTemporaryBan).toHaveBeenCalledWith(
            player.conn,
            player.auth,
            "spam",
            expect.any(Number),
            30_000
        );
        expect(runtime.ban.upsertBan).toHaveBeenCalledWith(banItem);
        expect(nativeRoom.kickPlayer).toHaveBeenCalledWith(7, "spam", true);
    });

    it("ignores banPlayerTemporarily for missing players", async () => {
        const { runtime, nativeRoom } = createRuntime();

        await expect(
            handleRoomCommand(
                runtime,
                createRequest("banPlayerTemporarily", { id: 99, ban: false, reason: "spam", seconds: 30 })
            )
        ).resolves.toBeUndefined();

        expect(runtime.ban.createTemporaryBan).not.toHaveBeenCalled();
        expect(runtime.ban.upsertBan).not.toHaveBeenCalled();
        expect(nativeRoom.kickPlayer).not.toHaveBeenCalled();
    });

    it("handles broadcast", async () => {
        const { runtime } = createRuntime();

        await expect(handleRoomCommand(runtime, createRequest("broadcast", { message: "hello all" }))).resolves.toBeUndefined();

        expect(runtime.room.sendAnnouncement).toHaveBeenCalledWith("hello all", null, 0xffff00, "bold", 2);
    });

    it("handles whisper", async () => {
        const { runtime } = createRuntime();

        await expect(handleRoomCommand(runtime, createRequest("whisper", { id: 7, message: "psst" }))).resolves.toBeUndefined();

        expect(runtime.room.sendAnnouncement).toHaveBeenCalledWith("psst", 7, 0xffff00, "bold", 2);
    });

    it("handles getNotice and setNotice", async () => {
        const { runtime } = createRuntime();

        await expect(handleRoomCommand(runtime, createRequest("getNotice", undefined))).resolves.toBe("notice");
        await expect(handleRoomCommand(runtime, createRequest("setNotice", { message: "new notice" }))).resolves.toBeUndefined();

        expect(runtime.notification.setNotice).toHaveBeenCalledWith("new notice");
    });

    it("handles setPassword", async () => {
        const { runtime } = createRuntime();

        await expect(handleRoomCommand(runtime, createRequest("setPassword", { password: "" }))).resolves.toBeUndefined();
        await expect(handleRoomCommand(runtime, createRequest("setPassword", { password: "secret" }))).resolves.toBeUndefined();

        expect(runtime.room.setPassword).toHaveBeenNthCalledWith(1, null);
        expect(runtime.config.setRoomPassword).toHaveBeenNthCalledWith(1, undefined);
        expect(runtime.room.setPassword).toHaveBeenNthCalledWith(2, "secret");
        expect(runtime.config.setRoomPassword).toHaveBeenNthCalledWith(2, "secret");
    });

    it("handles getChatFreeze and setChatFreeze", async () => {
        const { runtime } = createRuntime();

        await expect(handleRoomCommand(runtime, createRequest("getChatFreeze", undefined))).resolves.toBe(false);
        await expect(handleRoomCommand(runtime, createRequest("setChatFreeze", { freeze: true }))).resolves.toBeUndefined();

        expect(runtime.chat.setAllMuted).toHaveBeenCalledWith(true);
        expect(emitPlayerStatusChange).toHaveBeenCalledWith(0);
    });

    it("handles setPlayerMute", async () => {
        const { runtime, player } = createRuntime();

        await expect(
            handleRoomCommand(runtime, createRequest("setPlayerMute", { id: 7, muteExpireTime: 1234 }))
        ).resolves.toBeUndefined();

        expect(player.permissions.mute).toBe(true);
        expect(player.permissions.muteExpire).toBe(1234);
        expect(emitPlayerStatusChange).toHaveBeenCalledWith(7);
    });

    it("ignores setPlayerMute for missing players", async () => {
        const { runtime } = createRuntime();

        await expect(
            handleRoomCommand(runtime, createRequest("setPlayerMute", { id: 99, muteExpireTime: 1234 }))
        ).resolves.toBeUndefined();

        expect(emitPlayerStatusChange).not.toHaveBeenCalled();
    });

    it("handles setPlayerUnmute", async () => {
        const { runtime, player } = createRuntime();
        player.permissions.mute = true;

        await expect(handleRoomCommand(runtime, createRequest("setPlayerUnmute", { id: 7 }))).resolves.toBeUndefined();

        expect(player.permissions.mute).toBe(false);
        expect(emitPlayerStatusChange).toHaveBeenCalledWith(7);
    });

    it("ignores setPlayerUnmute for missing players", async () => {
        const { runtime } = createRuntime();

        await expect(handleRoomCommand(runtime, createRequest("setPlayerUnmute", { id: 99 }))).resolves.toBeUndefined();

        expect(emitPlayerStatusChange).not.toHaveBeenCalled();
    });

    it("handles getTeamColours", async () => {
        const { runtime } = createRuntime();

        await expect(handleRoomCommand(runtime, createRequest("getTeamColours", { team: TeamID.Red }))).resolves.toEqual({
            angle: 0,
            textColour: 0xffffff,
            teamColour1: 0xe66e55,
            teamColour2: 0xe66e55,
            teamColour3: 0xe66e55,
        });
        await expect(handleRoomCommand(runtime, createRequest("getTeamColours", { team: TeamID.Blue }))).resolves.toEqual({
            angle: 0,
            textColour: 0xffffff,
            teamColour1: 0x5a89e5,
            teamColour2: 0x5a89e5,
            teamColour3: 0x5a89e5,
        });
    });

    it("handles setTeamColours", async () => {
        const { runtime } = createRuntime();

        await expect(
            handleRoomCommand(
                runtime,
                createRequest("setTeamColours", {
                    team: TeamID.Red,
                    angle: 45,
                    textColour: 0xffffff,
                    teamColour1: 0x111111,
                    teamColour2: 0x222222,
                    teamColour3: 0x333333,
                })
            )
        ).resolves.toBeUndefined();

        expect(runtime.room.setTeamColours).toHaveBeenCalledWith("red", {
            angle: 45,
            textColour: 0xffffff,
            teamColour1: 0x111111,
            teamColour2: 0x222222,
            teamColour3: 0x333333,
        });
    });

    it("handles getDiscordWebhookConfig and setDiscordWebhookConfig", async () => {
        const { runtime, webhookConfig } = createRuntime();
        const updatedConfig = {
            feed: false,
            replayUpload: false,
            replaysWebhookId: "updated-replay-id",
            replaysWebhookToken: "updated-replay-token",
            passwordWebhookId: "updated-password-id",
            passwordWebhookToken: "updated-password-token",
        };

        await expect(handleRoomCommand(runtime, createRequest("getDiscordWebhookConfig", undefined))).resolves.toEqual(
            webhookConfig
        );
        await expect(
            handleRoomCommand(runtime, createRequest("setDiscordWebhookConfig", { config: updatedConfig }))
        ).resolves.toBeUndefined();

        expect(runtime.social.updateDiscordWebhookConfig).toHaveBeenCalledWith(updatedConfig);
    });
});
