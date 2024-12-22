
import {Obj} from './obj';
import {type Config, World} from './world';

type GetTimeRequest = {type: 'get-time', data: undefined};
type GetTimeResponse = {type: 'get-time', data: Date | undefined};

type GetTimeWarpRequest = {type: 'get-time-warp', data: undefined};
type GetTimeWarpResponse = {type: 'get-time-warp', data: number};

type SetTimeWarpRequest = {type: 'set-time-warp', data: number};
type SetTimeWarpResponse = {type: 'set-time-warp', data: undefined};

type GetObjectRequest = {type: 'get-object', data: string};
type GetObjectResponse = {type: 'get-object', data: Obj};

type GetAllObjectsRequest = {type: 'get-all-objects', data: undefined};
type GetAllObjectsResponse = {type: 'get-all-objects', data: {path: string, object: Obj | undefined}[]};

type GetAllObjectPathsRequest = {type: 'get-all-object-paths', data: undefined};
type GetAllObjectPathsResponse = {type: 'get-all-object-paths', data: string[]};

type GetObjectCountRequest = {type: 'get-object-count', data: undefined};
type GetObjectCountResponse = {type: 'get-object-count', data: number};

type GetConfigRequest = {type: 'get-config', data: string};
type GetConfigResponse = {type: 'get-config', data: Config[keyof Config]};

type StartRequest = {type: 'start', data: undefined};
type StartResponse = {type: 'start', data: undefined};

type StopRequest = {type: 'stop', data: undefined};
type StopResponse = {type: 'stop', data: undefined};

type RequestResponseTypeMap = 
    | {request: GetTimeRequest, response: GetTimeResponse}
    | {request: GetTimeWarpRequest, response: GetTimeWarpResponse}
    | {request: SetTimeWarpRequest, response: SetTimeWarpResponse}
    | {request: GetObjectRequest, response: GetObjectResponse}
    | {request: GetAllObjectsRequest, response: GetAllObjectsResponse}
    | {request: GetAllObjectPathsRequest, response: GetAllObjectPathsResponse}
    | {request: GetObjectCountRequest, response: GetObjectCountResponse}
    | {request: GetConfigRequest, response: GetConfigResponse}
    | {request: StartRequest, response: StartResponse}
    | {request: StopRequest, response: StopResponse};

type Request = RequestResponseTypeMap['request'];
type Response = RequestResponseTypeMap['response'];
type Message = Request | Response;

type ResponseForRequest<T extends Message> = T extends Request 
    ? (T extends RequestResponseTypeMap['request'] ? Extract<RequestResponseTypeMap, { request: T }>['response'] : never)
    : (T extends RequestResponseTypeMap['response'] ? Extract<RequestResponseTypeMap, { request: T }>['request'] : never)

interface SentRequest {
    id: number;
    data: Request;
}

interface SentResponse {
    id: number;
    data: Response;
}

class Server {

    world: World;

    sent: SentResponse[] = [];
    waitingMsgs: {[key: number]: (value: any) => void} = {};

    constructor(world: World) {
        this.world = world;
    }

    async respond<T extends Response>(id: number, type: T['type'], data: T['data'] = undefined): Promise<void> {
        // @ts-ignore
        this.sent.push({id: id, data: {type: type, data: data}});
    }

    recv({id, data: request}: SentRequest): void {
        const {type, data} = request;
        if (type == 'get-time') {
            this.respond<GetTimeResponse>(id, 'get-time', this.world.time);
        } else if (type == 'get-time-warp') {
            this.respond<GetTimeWarpResponse>(id, 'get-time-warp', this.world.timeWarp);
        } else if (type == 'set-time-warp') {
            this.world.timeWarp = data;
            this.respond<SetTimeWarpResponse>(id, 'set-time-warp');
        } else if (type == 'get-object') {
            this.respond<GetObjectResponse>(id, 'get-object', this.world.readObj(data));
        } else if (type == 'get-all-objects') {
            this.respond<GetAllObjectsResponse>(id, 'get-all-objects', this.world.lsObjAll().map(x => {return {path: x, object: this.world.readObj(x)}}));
        } else if (type == 'get-all-object-paths') {
            this.respond<GetAllObjectPathsResponse>(id, 'get-all-object-paths', this.world.lsObjAll());
        } else if (type == 'get-object-count') {
            this.respond<GetObjectCountResponse>(id, 'get-object-count', this.world.lsObjAll().length);
        } else if (type == 'get-config') {
            this.respond<GetConfigResponse>(id, 'get-config', this.world.config[data]);
        } else if (type == 'start') {
            this.world.start();
            this.respond<StartResponse>(id, 'start');
        } else if (type == 'stop') {
            this.world.stop();
            this.respond<StopResponse>(id, 'stop');
        }
    }

    clientRecv(): SentResponse[] {
        const sent = this.sent;
        this.sent = [];
        return sent;
    }

    init(): void {
        this.world.init();
    }

    start(): void {
        this.world.start();
    }

    stop(): void {
        this.world.stop();
    }

}

export {
    GetTimeRequest,
    GetTimeResponse,
    GetTimeWarpRequest,
    GetTimeWarpResponse,
    SetTimeWarpRequest,
    GetObjectRequest,
    GetObjectResponse,
    GetAllObjectsRequest,
    GetAllObjectsResponse,
    GetAllObjectPathsRequest,
    GetAllObjectPathsResponse,
    GetObjectCountRequest,
    GetObjectCountResponse,
    GetConfigRequest,
    GetConfigResponse,
    StartRequest,
    StartResponse,
    StopRequest,
    StopResponse,
    RequestResponseTypeMap,
    Request,
    Response,
    Message,
    ResponseForRequest,
    SentRequest,
    SentResponse,
    Server,
}
