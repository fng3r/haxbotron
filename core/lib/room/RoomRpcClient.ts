import { v4 as uuid } from "uuid";
import {
    AnyRoomRpcRequest,
    RoomRpcCommand,
    AnyRoomRpcResponse,
    RoomRpcPayload,
    RoomRpcRequest,
    RoomRpcResult,
    isRoomRpcResponseForCommand,
} from "./RoomProtocol";

type PendingRequest = {
    command: RoomRpcCommand;
    resolve: (value: unknown) => void;
    reject: (reason?: unknown) => void;
    timer: NodeJS.Timeout;
};

export class RoomRpcClient {
    private readonly pendingRequests = new Map<string, PendingRequest>();

    constructor(
        private readonly sendRequest: (request: AnyRoomRpcRequest) => void,
        private readonly scopeLabel: string
    ) {}

    public async request<C extends RoomRpcCommand>(
        command: C,
        payload: RoomRpcPayload<C>,
        timeoutMs: number
    ): Promise<RoomRpcResult<C>> {
        const requestId = uuid();
        const request: RoomRpcRequest<C> = {
            type: "request",
            requestId,
            command,
            payload,
        };

        return await new Promise<RoomRpcResult<C>>((resolve, reject) => {
            const timer = setTimeout(() => {
                this.pendingRequests.delete(requestId);
                reject(new Error(`[RoomRpcClient] '${String(command)}' timed out in ${this.scopeLabel}`));
            }, timeoutMs);

            this.pendingRequests.set(requestId, {
                command,
                resolve: (value) => {
                    resolve(value as RoomRpcResult<C>);
                },
                reject,
                timer,
            });

            this.sendRequest(request as AnyRoomRpcRequest);
        });
    }

    public handleResponse(response: AnyRoomRpcResponse): void {
        const pending = this.pendingRequests.get(response.requestId);
        if (!pending) {
            return;
        }

        clearTimeout(pending.timer);
        this.pendingRequests.delete(response.requestId);

        if (!isRoomRpcResponseForCommand(response, pending.command)) {
            pending.reject(
                new Error(`[RoomRpcClient] Mismatched response for '${pending.command}' in ${this.scopeLabel}`)
            );
            return;
        }

        if (response.success) {
            pending.resolve(response.result);
            return;
        }

        pending.reject(new Error(response.error.message));
    }

    public rejectAll(error: unknown): void {
        const rejection = error instanceof Error ? error : new Error(String(error));

        for (const pending of this.pendingRequests.values()) {
            clearTimeout(pending.timer);
            pending.reject(rejection);
        }

        this.pendingRequests.clear();
    }
}
