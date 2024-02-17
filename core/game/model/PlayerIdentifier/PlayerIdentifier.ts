export type PlayerId = {
    id: number
};

export type PlayerAuth = {
    auth: string
};

export type PlayerIdentifier = PlayerId | PlayerAuth;

export const extractPlayerIdentifier = (playerIdentifier: string): PlayerIdentifier => {
    if (playerIdentifier.charAt(0) == "#") {
        return {id: parseInt(playerIdentifier.substr(1), 10)};
    }

    return {auth: playerIdentifier.substr(1)};
}

export const isPlayerId = (playerIdentifier: PlayerIdentifier): boolean => {
    return "id" in playerIdentifier;
}

export const isPlayerAuth = (playerIdentifier: PlayerIdentifier): boolean => {
    return "auth" in playerIdentifier;
}