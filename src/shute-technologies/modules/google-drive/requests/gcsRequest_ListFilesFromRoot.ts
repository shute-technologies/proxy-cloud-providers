import { GoogleDriveProxy } from '../googleDriveProxy';
import { GCSBaseRequest } from '../gcsBaseRequest';
import { GCSConfig } from '../config/gcsConfig';
import { GCSIRequestResponseArg } from './data/gcsIResquestResponseArg';
import { IRCallback2 } from 'shute-technologies.common-and-utils';
import { PCPDebugConsole } from '../../../helpers/pcpConsole';

export interface GCSRequest_LFFRResponse<TArg> extends GCSIRequestResponseArg {
  response: any;
  arguments: TArg;
}

export class GCSRequest_ListFilesFromRoot<TArg> extends GCSBaseRequest<GCSRequest_LFFRResponse<TArg>> {
  private _arguments?: TArg;

  constructor(private readonly _gcsUserDrive: GoogleDriveProxy) {
    super(_gcsUserDrive);
  }

  request(onCallbackResponse: IRCallback2<boolean, GCSRequest_LFFRResponse<TArg>>, args?: TArg) {
    this._arguments = args;
    this._onCallbackResponse = onCallbackResponse;

    const queryObject = GCSConfig.SFFQuery_AllFilesFromRoot();

    this._googleApi.client.drive.files.list(queryObject).then(
      (response) => {
        if (this._onCallbackResponse) {
          this._onCallbackResponse(true, {
            response, 
            arguments: this._arguments
          } as GCSRequest_LFFRResponse<TArg>);
        }

        this.doFinishRequest();
      },
      (reason) => {
        PCPDebugConsole.warn(this, '::exception', reason);

        if (this._onCallbackResponse) {
          this._onCallbackResponse(true, {
            errorReason: reason, 
            arguments: this._arguments
          } as GCSRequest_LFFRResponse<TArg>);
        }

        this.doFinishRequest();
      }
    );
  }

  override destroy(): void {
    super.destroy();
    this._arguments = undefined;
  }
}
