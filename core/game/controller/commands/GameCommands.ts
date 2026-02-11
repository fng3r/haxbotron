export interface CommandDefinition {
    primaryName: string;
    altNames: readonly string[];
}

export const GameCommands = {
    about: { primaryName: "about", altNames: [] },
    adm: { primaryName: "adm", altNames: [] },
    auth: { primaryName: "auth", altNames: [] },
    deanon: { primaryName: "deanon", altNames: [] },
    freeze: { primaryName: "freeze", altNames: [] },
    help: { primaryName: "help", altNames: [] },
    list: { primaryName: "list", altNames: [] },
    listroles: { primaryName: "listroles", altNames: [] },
    map: { primaryName: "map", altNames: [] },
    mute: { primaryName: "mute", altNames: [] },
    mutes: { primaryName: "mutes", altNames: [] },
    ban: { primaryName: "ban", altNames: [] },
    bans: { primaryName: "bans", altNames: [] },
    setpassword: { primaryName: "setpassword", altNames: [] },
    staff: { primaryName: "staff", altNames: [] },
    switch: { primaryName: "switch", altNames: [] },
    teamChat: { primaryName: "x", altNames: ["X", "ч", "Ч"] },
    bb: { primaryName: "bb", altNames: ["BB", "ии","ИИ"] }
} as const satisfies Record<string, CommandDefinition>;

export type GameCommandKey = keyof typeof GameCommands;

export const CommandListGroups = {
    red: "red",
    blue: "blue",
    spec: "spec"
} as const;