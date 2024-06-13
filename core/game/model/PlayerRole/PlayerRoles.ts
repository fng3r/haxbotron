import {PlayerRole} from "./PlayerRole";

export enum PlayerRoles {
    CO_HOST = 'co-host',
    S_ADM = 's-adm',
    ADM = 'adm',
    PLAYER = 'player',
    BAD = 'bad'
}

export namespace PlayerRoles {
    const ROLE_PRIORITIES = {
        [PlayerRoles.CO_HOST]: 1,
        [PlayerRoles.S_ADM]: 2,
        [PlayerRoles.ADM]: 3,
        [PlayerRoles.PLAYER]: 4,
        [PlayerRoles.BAD]: 5
    };

    export function atLeast(playerRole: PlayerRole, comparedRole: PlayerRoles): boolean {
        return ROLE_PRIORITIES[playerRole.role] <= ROLE_PRIORITIES[comparedRole];
    }

    export function less(roleA: PlayerRole, roleB: PlayerRole): boolean {
        return ROLE_PRIORITIES[roleA.role] > ROLE_PRIORITIES[roleB.role];
    }
}