import { RoomRuntime } from "../../runtime/RoomRuntime";

export function onRoomLinkListener(runtime: RoomRuntime, url: string): void {
    runtime.room.setLink(url);
    runtime.logger.i('onRoomLink', `This room has a link now: ${url}`);
}
