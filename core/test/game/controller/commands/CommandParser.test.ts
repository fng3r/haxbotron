/// <reference types="jest" />

import { describe, expect, it } from "@jest/globals";
import { parseCommand } from "../../../../game/controller/commands/CommandParser";
import { GameCommandKey } from "../../../../game/controller/commands/GameCommands";

describe("CommandParser", () => {
    function expectParsed(input: string, commandName: GameCommandKey, commandArgs: any[] = []): void {
        expect(parseCommand(input)).toEqual({ commandName, commandArgs });
    }

    it("parses plain commands without arguments", () => {
        expectParsed("!about", "about");
        expectParsed("!adm", "adm");
        expectParsed("!freeze", "freeze");
        expectParsed("!listroles", "listroles");
        expectParsed("!bans", "bans");
        expectParsed("!mutes", "mutes");
        expectParsed("!staff", "staff");
        expectParsed("!switch", "switch");
    });

    it("parses commands with optional arguments", () => {
        expectParsed("!auth", "auth", [undefined]);
        expectParsed("!auth #13", "auth", [13]);

        expectParsed("!help", "help", [undefined]);
        expectParsed("!help mute", "help", ["mute"]);

        expectParsed("!list", "list", [undefined]);
        expectParsed("!list red", "list", ["red"]);

        expectParsed("!setpassword", "setpassword", [undefined]);
        expectParsed("!setpassword secret", "setpassword", ["secret"]);
    });

    it("parses commands with required arguments", () => {
        expectParsed("!deanon #4", "deanon", [4]);
        expectParsed("!map classic", "map", ["classic"]);
    });

    it("parses ban and mute identifiers/durations", () => {
        expectParsed("!ban #5", "ban", ["#5", undefined]);
        expectParsed("!ban #5 20", "ban", ["#5", 20]);
        expectParsed("!ban $auth_token", "ban", ["$auth_token", undefined]);

        expectParsed("!mute #2", "mute", ["#2", undefined]);
        expectParsed("!mute #2 7", "mute", ["#2", 7]);
        expectParsed("!mute $auth_token", "mute", ["$auth_token", undefined]);
    });

    it("parses alias commands", () => {
        expectParsed("!bb", "bb");
        expectParsed("!ии", "bb");
        expectParsed("!x team message", "teamChat", ["team message"]);
        expectParsed("!ч team message", "teamChat", ["team message"]);
    });

    it("ignores surrounding whitespace", () => {
        expectParsed("   !about   ", "about");
    });

    it("returns null for invalid commands", () => {
        expect(parseCommand("about")).toBeNull();
        expect(parseCommand("!unknown")).toBeNull();
        expect(parseCommand("!map")).toBeNull();
        expect(parseCommand("!deanon")).toBeNull();
        expect(parseCommand("!about trailing")).toBeNull();
        expect(parseCommand("!listrolesX")).toBeNull();
    });

    it("does not collapse longer commands into shorter prefixes", () => {
        expectParsed("!listroles", "listroles");
        expectParsed("!bans", "bans");
        expectParsed("!mutes", "mutes");
    });
});
