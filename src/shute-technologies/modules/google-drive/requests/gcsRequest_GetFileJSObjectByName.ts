import { GoogleDriveProxy } from '../googleDriveProxy';
import { GCSBaseRequest } from '../gcsBaseRequest';
import { ICallback2 } from 'shute-technologies.common-and-utils';
import { GCSIRequestResponseArg } from './data/gcsIResquestResponseArg';
import { PCPDebugConsole } from '../../../helpers/pcpConsole';

export interface GCSRequest_GFJSOBNResponse extends GCSIRequestResponseArg {
  jsObject: {};
  arguments: any;
}

export class GCSRequest_GetFileJSObjectByName extends GCSBaseRequest {
  private _arguments: any;

  constructor(private readonly _gcsUserDrive: GoogleDriveProxy) {
    super(_gcsUserDrive);
  }

  request(fileName: string, folderId: string, onCallbackResponse: ICallback2<boolean, GCSRequest_GFJSOBNResponse>, args): void {
    this._arguments = args;
    this._onCallbackResponse = onCallbackResponse;

    this._gcsUserDrive.existsFileInFolderByName(fileName, folderId, this.onResult_ExistsFile);
  }

  private onResult_ExistsFile(existsFile: boolean, fileId: string): void {
    if (existsFile) {
      this._googleApi.client.drive.files
        .get({
          fileId,
          alt: 'media',
        })
        .then(
          (response) => {
            const jsonRawString = atob(response.body);

            if (this._onCallbackResponse) {
              this._onCallbackResponse(true, {
                jsObject: JSON.parse(jsonRawString), 
                arguments: this._arguments
              } as GCSRequest_GFJSOBNResponse);
            }

            this.doFinishRequest();
          },
          (reason) => {
            PCPDebugConsole.warn(this, '::exception', reason);

            if (this._onCallbackResponse) {
              this._onCallbackResponse(false, {
                jsObject: null, 
                arguments: this._arguments,
                errorReason: reason
              } as GCSRequest_GFJSOBNResponse);
            }

            this.doFinishRequest();
          }
        );
    } else {
      if (this._onCallbackResponse) {
        this._onCallbackResponse(false, {
          jsObject: null, 
          arguments: this._arguments
        } as GCSRequest_GFJSOBNResponse);
      }

      this._gcsUserDrive.clearRequest(this);
    }
  }

  destroy(): void {
    super.destroy();
    this._arguments = null;
  }
}
