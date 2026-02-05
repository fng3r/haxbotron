import { PlayerRole } from "../../game/model/PlayerRole/PlayerRole";

/**
 * PlayerRole repository interface
 */
export interface IPlayerRoleRepository {
  create(playerRole: PlayerRole): Promise<void>;
  read(auth: string): Promise<PlayerRole | null>;
  update(playerRole: PlayerRole): Promise<void>;
  delete(auth: string): Promise<void>;
}
