import Router from "koa-router";
import * as roomController from '../../../controller/api/v1/room';

export const roomRouter = new Router();

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

roomRouter.get('/:ruid/filter/nickname', roomController.getNicknameTextFilteringPool); // get banned words pool for chat filter
roomRouter.get('/:ruid/filter/chat', roomController.getChatTextFilteringPool); // get banned words pool for nickname filter
roomRouter.post('/:ruid/filter/nickname', roomController.setNicknameTextFilter); // set banned words pool for chat filter
roomRouter.post('/:ruid/filter/chat', roomController.setChatTextFilter); // set banned words pool for nickname filter
roomRouter.delete('/:ruid/filter/nickname', roomController.clearNicknameTextFilter); // clear banned words pool for chat filter
roomRouter.delete('/:ruid/filter/chat', roomController.clearChatTextFilter); // clear banned words pool for nickname filter

roomRouter.get('/:ruid/asset/team/colour', roomController.getTeamColours); // get team colours
roomRouter.post('/:ruid/asset/team/colour', roomController.setTeamColours); // set team colours
