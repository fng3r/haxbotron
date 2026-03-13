/// <reference types="jest" />

import { describe, expect, it, jest } from "@jest/globals";
import { TeamID } from "../../../game/model/GameObject/TeamID";
import { handleRoomCommand } from "../../../game/runtime/RoomCommandHandler";
import { RoomRuntime } from "../../../game/runtime/RoomRuntime";
import { RuntimeRoomRpcCommand, RuntimeRoomRpcRequest } from "../../../lib/room/RoomProtocol";

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

function createRuntime(): { runtime: MockRoomRuntime; nativeRoom: { stopRecording: jest.Mock; setTeamColors: jest.Mock } } {
    const nativeRoom = {
        stopRecording: jest.fn(),
        setTeamColors: jest.fn(),
    };
    const configValue = {
        _config: { roomName: "Phase 3 Room" },
        settings: { chatFloodCriterion: 5 },
        rules: { fairPlay: true },
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
            getPlayerCount: jest.fn().mockReturnValue(4),
            getPlayerList: jest.fn().mockReturnValue(new Map()),
        },
        playerRole: {},
        playerOnboarding: {},
        match: {},
        ban: {
            createTemporaryBan: jest.fn(),
            upsertBan: jest.fn(),
        },
        chat: {
            isAllMuted: jest.fn().mockReturnValue(false),
            setAllMuted: jest.fn(),
        },
        social: {
            getDiscordWebhook: jest.fn().mockReturnValue({ url: "https://discord.example/webhook" }),
            updateDiscordWebhook: jest.fn(),
        },
        notification: {
            getNotice: jest.fn().mockReturnValue(null),
            setNotice: jest.fn(),
        },
        logger: {
            i: jest.fn(),
            w: jest.fn(),
            e: jest.fn(),
        },
    } as unknown as MockRoomRuntime;

    return { runtime, nativeRoom };
}

describe("RoomCommandHandler", () => {
    it("returns room info from the room runtime", async () => {
        const { runtime } = createRuntime();

        const result = await handleRoomCommand(runtime, createRequest("getRoomInfo", undefined));

        expect(result).toEqual({
            roomName: "Phase 3 Room",
            onlinePlayers: 4,
        });
    });

    it("normalizes empty password values before updating the room", async () => {
        const { runtime } = createRuntime();

        await handleRoomCommand(runtime, createRequest("setPassword", { password: "" }));

        expect(runtime.room.setPassword).toHaveBeenCalledWith(null);
        expect(runtime.config.setRoomPassword).toHaveBeenCalledWith(undefined);
    });

    it("updates native and cached team colours through the typed handler map", async () => {
        const { runtime, nativeRoom } = createRuntime();

        await handleRoomCommand(
            runtime,
            createRequest("setTeamColours", {
                team: TeamID.Red,
                angle: 45,
                textColour: 0xffffff,
                teamColour1: 0x111111,
                teamColour2: 0x222222,
                teamColour3: 0x333333,
            })
        );

        expect(nativeRoom.setTeamColors).toHaveBeenCalledWith(TeamID.Red, 45, 0xffffff, [0x111111, 0x222222, 0x333333]);
        expect(runtime.room.setTeamColours).toHaveBeenCalledWith("red", {
            angle: 45,
            textColour: 0xffffff,
            teamColour1: 0x111111,
            teamColour2: 0x222222,
            teamColour3: 0x333333,
        });
    });
});
