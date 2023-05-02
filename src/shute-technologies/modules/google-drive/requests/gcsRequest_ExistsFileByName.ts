import { GoogleDriveProxy } from '../googleDriveProxy';
import { GCSBaseRequest } from '../gcsBaseRequest';
import { ICallback2 } from 'shute-technologies.common-and-utils';
import { GCSConfig } from '../config/gcsConfig';
import { GCSIRequestResponseArg } from './data/gcsIResquestResponseArg';
import { PCPDebugConsole } from '../../../helpers/pcpConsole';

export interface GCSRequest_EFBNResponse extends GCSIRequestResponseArg {
  existsFile: boolean;
  fileId: string;
  arguments: any;
}

export class GCSRequest_ExistsFileByName extends GCSBaseRequest {
  
  private _arguments: any;

  constructor(private readonly _gcsUserDrive: GoogleDriveProxy) {
    super(_gcsUserDrive);
  }

  request(fileName: string, onCallbackResponse: ICallback2<boolean, GCSRequest_EFBNResponse>, args: any): void {
    this._arguments = args;
    this._onCallbackResponse = onCallbackResponse;

    const queryObject = GCSConfig.SFFQuery_GetFile(fileName);

    this._googleApi.client.drive.files.list(queryObject).then(
      (response) => {
        if (this._onCallbackResponse) {
          const existsFile = response.result.files && response.result.files.length > 0;
          const fileId = existsFile ? response.result.files[0].id : undefined;

          this._onCallbackResponse(true, 
            {
              existsFile,
              fileId, 
              arguments: this._arguments
            } as GCSRequest_EFBNResponse);
        }

        this.doFinishRequest();
      },
      (reason) => {
        PCPDebugConsole.warn(this, '::exception', reason);

        if (this._onCallbackResponse) {
          this._onCallbackResponse(false, 
            {
              existsFile: false,
              fileId: null, 
              arguments: this._arguments,
              errorReason: reason
            } as GCSRequest_EFBNResponse);
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
