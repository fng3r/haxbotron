import { PlayerStorage } from "../../game/model/GameObject/PlayerObject";
import { IRepository } from "./IRepository";

/**
 * Player repository interface
 */
export interface IPlayerRepository {
  create(ruid: string, player: PlayerStorage): Promise<void>;
  read(ruid: string, auth: string): Promise<PlayerStorage | null>;
  update(ruid: string, player: PlayerStorage): Promise<void>;
  delete(ruid: string, auth: string): Promise<void>;
  exists(ruid: string, auth: string): Promise<boolean>;
}
