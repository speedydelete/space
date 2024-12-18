
import {Obj} from './obj';
import {type Config, World} from './world';
import {defaultWorld} from './default_world';

type GetTimeRequest = {type: 'get-time', data: undefined};
type GetTimeResponse = {type: 'get-time', data: Date};

type GetTimeWarpRequest = {type: 'get-time-warp', data: undefined};
type GetTimeWarpResponse = {type: 'get-time-warp', data: number};

type SetTimeWarpRequest = {type: 'set-time-warp', data: number};
type SetTimeWarpResponse = {type: 'set-time-warp', data: undefined};

type GetObjectRequest = {type: 'get-object', data: string};
type GetObjectResponse = {type: 'get-object', data: Obj};

type GetAllObjectsRequest = {type: 'get-all-objects', data: undefined};
type GetAllObjectsResponse = {type: 'get-all-objects', data: {path: string, object: Obj}[]};

type GetAllObjectPathsRequest = {type: 'get-all-objects', data: undefined};
type GetAllObjectPathsResponse = {type: 'get-all-objects', data: {path: string, object: Obj}[]};

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
type Response = RequestResponseTypeMap['request'];

type ResponseForRequest<T extends Request> = T extends RequestResponseTypeMap['request'] ? Extract<RequestResponseTypeMap, { request: T }>['response'] : never;

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

    constructor() {
        this.world = defaultWorld;
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
    Request,
    Response,
    RequestResponseTypeMap,
    ResponseForRequest,
    SentRequest,
    SentResponse,
    Server,
}
