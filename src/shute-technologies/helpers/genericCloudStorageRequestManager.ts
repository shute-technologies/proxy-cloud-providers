import { ICallback1 } from "shute-technologies.common-and-utils";
import { GCSBaseRequest } from "../modules/google-drive/gcsBaseRequest";
import { PCPDebugConsole } from './pcpConsole';
import { GCSIRequestResponseArg } from '../modules/google-drive/requests/data/gcsIResquestResponseArg';

export class GenericCloudStorageRequestManager {
  private _requests: { request: GCSBaseRequest<GCSIRequestResponseArg>; finished: boolean }[];

  constructor(
    private _onFinishedAllCallback: ICallback1<any> | null, 
    private readonly _args: any
  ) {
    this._requests = [];
  }

  addRequest(request: GCSBaseRequest<GCSIRequestResponseArg>): void {
    let existsRequests = false;

    for (let i = 0; i < this._requests.length; i++) {
      if (this._requests[i].request.uid === request.uid) {
        existsRequests = true;
        break;
      }
    }

    if (!existsRequests) {
      request.gcsReqManager = this;

      this._requests.push({ request, finished: false });
    } else {
      PCPDebugConsole.warn(this, 'AddRequest> Already', ' added this request: ', request.uid);
    }
  }

  finishedRequest<T extends GCSIRequestResponseArg>(request: GCSBaseRequest<T>): void {
    const totalRequests = this._requests.length;
    let completedRequests = 0;

    for (var i = 0; i < totalRequests; i++) {
      if (this._requests[i].request.uid === request.uid) {
        this._requests[i].finished = true;
      }

      completedRequests += this._requests[i].finished ? 1 : 0;
    }

    if (completedRequests === totalRequests && this._onFinishedAllCallback && completedRequests > 0) {
      this._onFinishedAllCallback(this._args);
    }
  }

  destroy(): void {
    this._onFinishedAllCallback = null;
  }
}
