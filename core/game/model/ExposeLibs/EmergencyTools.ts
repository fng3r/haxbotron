import { BanList } from "../PlayerBan/BanList";
import { PlayerObject } from "../GameObject/PlayerObject";
import { ServiceContainer } from "../../services/ServiceContainer";

// on dev-console tools for emergency
export const EmergencyTools = {
    list: function(): void { // print list of players joined
        const services = ServiceContainer.getInstance();
        const room = services.room.getRoom();
        
        var players = room.getPlayerList().filter((player: PlayerObject) => player.id != 0);
        players.forEach((player: PlayerObject) => {
            console.log(`[EMERGENCY.LIST]${player.name}#${player.id} team(${player.team}) admin(${player.admin})`);
        });
    },
    chat: function(msg: string, playerID?: number): void { // send chat
        const services = ServiceContainer.getInstance();
        
        if(playerID) {
            services.room.sendAnnouncement(msg, playerID, 0xFFFF00, "bold", 2);
            console.log(`[EMERGENCY.CHAT] the message is sent to #${playerID}. message: ${msg}`);
        } else {
            services.room.sendAnnouncement(msg, null, 0xFFFF00, "bold", 2);
            console.log(`[EMERGENCY.CHAT] the message is sent. message: ${msg}`);
        }
    },
    kick: function(playerID: number, msg?: string): void { // kick the player
        const services = ServiceContainer.getInstance();
        const room = services.room.getRoom();
        
        if(msg) {
            room.kickPlayer(playerID, msg, false);
            console.log(`[EMERGENCY.KICK] #${playerID} is kicked. reason:${msg}`);
        } else {
            room.kickPlayer(playerID, 'by haxbotron', false);
            console.log(`[EMERGENCY.BAN] #${playerID} is kicked.`);
        }
    },
    ban: function(playerID: number, msg?: string): void { // ban the player
        const services = ServiceContainer.getInstance();
        const room = services.room.getRoom();
        
        if(msg) {
            room.kickPlayer(playerID, msg, true);
            console.log(`[EMERGENCY.BAN] #${playerID} is banned. reason:${msg}`);
        } else {
            room.kickPlayer(playerID, 'by haxbotron', true);
            console.log(`[EMERGENCY.BAN] #${playerID} is banned.`);
        }
    },
    /*
    banclearall: function(): void { // clear all of ban list
        window.room.clearBans();
        Ban.bListClear();
        console.log(`[EMERGENCY.CLEARBANS] ban list is cleared.`);
    },
    banlist: function(): void {
        let bannedList: BanList[] = Ban.bListGetArray();
        bannedList.forEach((item: BanList) => {
            console.log(`[EMERGENCY.BANLIST] (${item.conn})is banned connection. (reason: ${item.reason})`);
        });
    },
    */
    password: function(password?: string): void { // set or clear the password key of the room
        const services = ServiceContainer.getInstance();
        const room = services.room.getRoom();
        
        if(password) {
            room.setPassword(password);
            console.log(`[EMERGENCY.PASSWORD] password is changed. key:${password}`);
        } else { // can be null
            room.setPassword(null);
            console.log(`[EMERGENCY.PASSWORD] password is cleared.`);
        }
    }
}