import {PlayerRoles} from "./PlayerRoles.js";

export interface PlayerRole {
    auth: string,
    name: string,
    role: PlayerRoles
}