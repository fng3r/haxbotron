import { BanList } from "../../game/model/PlayerBan/BanList";

/**
 * BanList repository interface
 */
export interface IBanListRepository {
  create(ruid: string, banList: BanList): Promise<void>;
  read(ruid: string, conn: string): Promise<BanList | null>;
  readAll(ruid: string): Promise<BanList[]>;
  update(ruid: string, banList: BanList): Promise<void>;
  delete(ruid: string, conn: string): Promise<void>;
}
