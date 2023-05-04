import { GoogleDriveProxy } from '../googleDriveProxy';
import { GCSBaseRequest } from '../gcsBaseRequest';
import { IRCallback2 } from 'shute-technologies.common-and-utils';
import { GCSIRequestResponseArg } from './data/gcsIResquestResponseArg';
import { PCPDebugConsole } from '../../../helpers/pcpConsole';

export interface GCSRequest_LFBQResponse extends GCSIRequestResponseArg {
  response: any;
  arguments: any;
}

export class GCSRequest_ListFilesByQuery extends GCSBaseRequest<GCSRequest_LFBQResponse> {

  private _arguments: any;

  constructor(private readonly _gcsUserDrive: GoogleDriveProxy) {
    super(_gcsUserDrive);
  }

  request(queryObject: any, onCallbackResponse: IRCallback2<boolean, GCSRequest_LFBQResponse>, args: any) {
    this._arguments = args;
    this._onCallbackResponse = onCallbackResponse;

    this._googleApi.client.drive.files.list(queryObject).then(
      (response) => {
        if (this._onCallbackResponse) {
          this._onCallbackResponse(true, {
            response, 
            arguments: this._arguments
          } as GCSRequest_LFBQResponse);
        }

        this.doFinishRequest();
      },
      (reason) => {
        PCPDebugConsole.warn(this, '::exception', reason);

        if (this._onCallbackResponse) {
          this._onCallbackResponse(true, {
            errorReason: reason, 
            arguments: this._arguments
          } as GCSRequest_LFBQResponse);
        }

        this.doFinishRequest();
      }
    );
  }

  override destroy(): void {
    super.destroy();
    this._arguments = null;
  }
}
