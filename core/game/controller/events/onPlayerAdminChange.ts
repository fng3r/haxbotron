import * as Tst from "../Translator";
import * as LangRes from "../../resource/strings";
import { updateAdmins } from "../RoomTools";
import { PlayerObject } from "../../model/GameObject/PlayerObject";
import {PlayerRoles} from "../../model/PlayerRole/PlayerRoles";

const ADMIN_ROLES = [PlayerRoles.ADM, PlayerRoles.S_ADM, PlayerRoles.CO_HOST];
const PRIVILEGED_ROLES = [PlayerRoles.S_ADM, PlayerRoles.CO_HOST];

export function onPlayerAdminChangeListener(changedPlayer: PlayerObject, byPlayer: PlayerObject): void {
    /* Event called when a player's admin rights are changed.
            byPlayer is the player which caused the event (can be null if the event wasn't caused by a player). */
    // let placeholderAdminChange = {
    //     playerID: changedPlayer.id,
    //     playerName: changedPlayer.name
    // }

    if (byPlayer) {
        window.gameRoom.logger.i('onPlayerAdminChange', `${changedPlayer.name}#${changedPlayer.id} admin rights were taken away by ${byPlayer.name}#${byPlayer.id}`);
        const byPlayerRole = window.gameRoom.playerRoles.get(byPlayer.id);
        if (!PRIVILEGED_ROLES.some(role => role === byPlayerRole.role)) { // s-adm+ can remove admin rights anyways
            const changedPlayerRole = window.gameRoom.playerRoles.get(changedPlayer.id);
            if (ADMIN_ROLES.some(role => role === changedPlayerRole.role)) { // if admin rights were taken away from admin+ role, give it back
                window.gameRoom._room.setPlayerAdmin(changedPlayer.id, true);
            }
        }
    }

    window._emitSIOPlayerStatusChangeEvent(changedPlayer.id);
}
