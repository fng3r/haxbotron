import { PlayerObject } from "../../model/GameObject/PlayerObject";
import { TeamID } from "../../model/GameObject/TeamID";
import { GameCommands} from "./GameCommands";
import * as LangRes from "../../resource/strings";
import * as Tst from "../Translator";

export function cmdList(byPlayer: PlayerObject, playerGroup?: string): void {
    let placeholder = {
        whoisResult: LangRes.command.list._ErrorNoOne
    };
    switch (playerGroup) {
        case GameCommands.listRed: {
            let players = window.gameRoom._room.getPlayerList().filter((player: PlayerObject) => player.id != 0 && player.team === TeamID.Red);
            if (players.length >= 1) {
                placeholder.whoisResult = ''; //init
                players.forEach((player: PlayerObject) => {
                    let muteFlag: string = '';
                    let afkFlag: string = '';
                    if (window.gameRoom.playerList.get(player.id)!.permissions.mute === true) {
                        muteFlag = '🔇';
                    }
                    placeholder.whoisResult += player.name + '#' + player.id + muteFlag + afkFlag + ', ';
                });
            }
            window.gameRoom._room.sendAnnouncement(Tst.maketext(LangRes.command.list.whoisList, placeholder), byPlayer.id, 0x479947, "normal", 1);
            break;
        }
        case GameCommands.listBlue: {
            let players = window.gameRoom._room.getPlayerList().filter((player: PlayerObject) => player.id != 0 && player.team === TeamID.Blue);
            if (players.length >= 1) {
                placeholder.whoisResult = ''; //init
                players.forEach((player: PlayerObject) => {
                    let muteFlag: string = '';
                    let afkFlag: string = '';
                    if (window.gameRoom.playerList.get(player.id)!.permissions.mute === true) {
                        muteFlag = '🔇';
                    }
                    placeholder.whoisResult += player.name + '#' + player.id + muteFlag + afkFlag + ', ';
                });
            }
            window.gameRoom._room.sendAnnouncement(Tst.maketext(LangRes.command.list.whoisList, placeholder), byPlayer.id, 0x479947, "normal", 1);
            break;
        }
        case GameCommands.listSpec: {
            let players = window.gameRoom._room.getPlayerList().filter((player: PlayerObject) => player.id != 0 && player.team === TeamID.Spec);
            if (players.length >= 1) {
                placeholder.whoisResult = ''; //init
                players.forEach((player: PlayerObject) => {
                    let muteFlag: string = '';
                    let afkFlag: string = '';
                    if (window.gameRoom.playerList.get(player.id)!.permissions.mute === true) {
                        muteFlag = '🔇';
                    }
                    placeholder.whoisResult += player.name + '#' + player.id + muteFlag + afkFlag + ', ';
                });
            }
            window.gameRoom._room.sendAnnouncement(Tst.maketext(LangRes.command.list.whoisList, placeholder), byPlayer.id, 0x479947, "normal", 1);
            break;
        }
        case null: {
            let players = window.gameRoom._room.getPlayerList().filter((player: PlayerObject) => player.id != 0);
            if (players.length >= 1) {
                placeholder.whoisResult = ''; //init
                players.forEach((player: PlayerObject) => {
                    let muteFlag: string = '';
                    let afkFlag: string = '';
                    if (window.gameRoom.playerList.get(player.id)!.permissions.mute === true) {
                        muteFlag = '🔇';
                    }
                    placeholder.whoisResult += player.name + '#' + player.id + muteFlag + afkFlag + ', ';
                });
            }
            window.gameRoom._room.sendAnnouncement(Tst.maketext(LangRes.command.list.whoisList, placeholder), byPlayer.id, 0x479947, "normal", 1);
            break;
        }
        default: {
            window.gameRoom._room.sendAnnouncement(LangRes.command.list._ErrorNoTeam, byPlayer.id, 0xFF7777, "normal", 2);
            break;
        }
    }
}
