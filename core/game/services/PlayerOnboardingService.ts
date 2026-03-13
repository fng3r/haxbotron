import { Player } from "../model/GameObject/Player";
import { PlayerObject, PlayerStorage } from "../model/GameObject/PlayerObject";
import { PlayerRole } from "../model/PlayerRole/PlayerRole";
import { PlayerRoles } from "../model/PlayerRole/PlayerRoles";
import { getInjectedDBRepository, InjectedDBRepository } from "../repositories/InjectedDBRepository";

export interface JoinHydrationResult {
    player: Player;
    previousName?: string;
}

export interface RoleResolutionResult {
    shouldRejectUnknown: boolean;
    role: PlayerRole;
}

/**
 * Encapsulates player join persistence/rehydration and role resolution logic.
 */
export class PlayerOnboardingService {
    constructor(private readonly repository: InjectedDBRepository = getInjectedDBRepository()) {}

    public async hydratePlayer(player: PlayerObject, joinTimestamp: number): Promise<JoinHydrationResult> {
        const existing = await this.repository.readPlayer(player.auth);
        if (existing) {
            return {
                player: this.createReturningPlayer(player, existing, joinTimestamp),
                previousName: existing.name !== player.name ? existing.name : undefined
            };
        }

        return {
            player: this.createNewPlayer(player, joinTimestamp)
        };
    }

    public async persistPlayer(player: Player): Promise<void> {
        await this.repository.upsertPlayer(this.repository.toPlayerStorage(player));
    }

    public async resolveRole(auth: string, name: string, whitelistEnabled: boolean): Promise<RoleResolutionResult> {
        const playerRole = await this.repository.readPlayerRole(auth);
        if (!playerRole || playerRole.name !== name) {
            if (whitelistEnabled) {
                return {
                    shouldRejectUnknown: true,
                    role: {
                        auth,
                        name,
                        role: PlayerRoles.PLAYER
                    }
                };
            }
        }

        return {
            shouldRejectUnknown: false,
            role: playerRole ?? {
                auth,
                name,
                role: PlayerRoles.PLAYER
            }
        };
    }

    private createReturningPlayer(player: PlayerObject, existing: PlayerStorage, joinTimestamp: number): Player {
        return new Player(
            player,
            existing.nicknames.concat(player.name),
            {
                mute: existing.mute,
                muteExpire: existing.muteExpire,
                malActCount: existing.malActCount,
            },
            {
                rejoinCount: existing.rejoinCount,
                joinDate: joinTimestamp,
                leftDate: existing.leftDate,
                matchEntryTime: 0,
            }
        );
    }

    private createNewPlayer(player: PlayerObject, joinTimestamp: number): Player {
        return new Player(
            player,
            [player.name],
            {
                mute: false,
                muteExpire: 0,
                malActCount: 0,
            },
            {
                rejoinCount: 0,
                joinDate: joinTimestamp,
                leftDate: 0,
                matchEntryTime: 0
            }
        );
    }
}
