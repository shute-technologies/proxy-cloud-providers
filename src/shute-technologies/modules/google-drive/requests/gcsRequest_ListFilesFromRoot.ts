import { GoogleDriveProxy } from '../googleDriveProxy';
import { GCSBaseRequest } from '../gcsBaseRequest';
import { GCSConfig } from '../config/gcsConfig';
import { GCSIRequestResponseArg } from './data/gcsIResquestResponseArg';
import { ICallback2 } from 'shute-technologies.common-and-utils';
import { PCPDebugConsole } from '../../../helpers/pcpConsole';

export interface GCSRequest_LFFRResponse extends GCSIRequestResponseArg {
  response;
  arguments;
}

export class GCSRequest_ListFilesFromRoot extends GCSBaseRequest {
  private _arguments: any;

  constructor(private readonly _gcsUserDrive: GoogleDriveProxy) {
    super(_gcsUserDrive);
  }

  request(onCallbackResponse: ICallback2<boolean, GCSRequest_LFFRResponse>, args?: any) {
    this._arguments = args;
    this._onCallbackResponse = onCallbackResponse;

    const queryObject = GCSConfig.SFFQuery_AllFilesFromRoot();

    this._googleApi.client.drive.files.list(queryObject).then(
      (response) => {
        if (this._onCallbackResponse) {
          this._onCallbackResponse(true, {
            response, 
            arguments: this._arguments
          } as GCSRequest_LFFRResponse);
        }

        this.doFinishRequest();
      },
      (reason) => {
        PCPDebugConsole.warn(this, '::exception', reason);

        if (this._onCallbackResponse) {
          this._onCallbackResponse(true, {
            errorReason: reason, 
            arguments: this._arguments
          } as GCSRequest_LFFRResponse);
        }

        this.doFinishRequest();
      }
    );
  }

  destroy(): void {
    super.destroy();
    this._arguments = null;
  }
}
