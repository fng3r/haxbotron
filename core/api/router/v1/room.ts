import Router from "koa-router";
import { RoomOperationsAPI } from "../../../lib/room";
import { createRoomController } from "../../controller/v1/room";

export function createRoomRouter(roomOperations: RoomOperationsAPI): Router {
    const roomController = createRoomController(roomOperations);
    const roomRouter = new Router();

    roomRouter.get('/', roomController.getRoomList); // get room list
    roomRouter.post('/', roomController.createRoom); // create room

    roomRouter.get('/:ruid', roomController.getRoomInfo); // get room info
    roomRouter.delete('/:ruid', roomController.terminateRoom); // create room

    roomRouter.get('/:ruid/player', roomController.getPlayersList); // get player list

    roomRouter.get('/:ruid/player/:id', roomController.getPlayerInfo); // get player info
    roomRouter.delete('/:ruid/player/:id', roomController.kickOnlinePlayer); // kick/ban player info

    roomRouter.get('/:ruid/player/:id/permission/mute', roomController.checkPlayerMuted); // check the player is muted
    roomRouter.post('/:ruid/player/:id/permission/mute', roomController.mutePlayer); // mute player
    roomRouter.delete('/:ruid/player/:id/permission/mute', roomController.unmutePlayer); // unmute player

    roomRouter.post('/:ruid/chat', roomController.broadcast); // send message to game room
    roomRouter.post('/:ruid/chat/:id', roomController.whisper); // send message to specific player

    roomRouter.get('/:ruid/info', roomController.getRoomDetailInfo); // get detail room info

    roomRouter.post('/:ruid/info/password', roomController.setPassword); // set password
    roomRouter.delete('/:ruid/info/password', roomController.clearPassword); // clear password

    roomRouter.get('/:ruid/info/freeze', roomController.checkChatFreezed); // check whether chat is freezed
    roomRouter.post('/:ruid/info/freeze', roomController.freezeChat); // freeze whole chat
    roomRouter.delete('/:ruid/info/freeze', roomController.unfreezeChat); // unfreeze whole chat

    roomRouter.get('/:ruid/social/notice', roomController.getNotice); // get notice message
    roomRouter.post('/:ruid/social/notice', roomController.setNotice); // set notice message
    roomRouter.delete('/:ruid/social/notice', roomController.deleteNotice); // delete notice message

    roomRouter.get('/:ruid/social/discord/webhook', roomController.getDiscordWebhookConfig); // get discord webhook configuration
    roomRouter.post('/:ruid/social/discord/webhook', roomController.setDiscordWebhookConfig); // set discord webhook configuration

    roomRouter.get('/:ruid/asset/team/colour', roomController.getTeamColours); // get team colours
    roomRouter.post('/:ruid/asset/team/colour', roomController.setTeamColours); // set team colours

    return roomRouter;
}
