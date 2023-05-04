import { GoogleDriveProxy } from '../googleDriveProxy';
import { GCSBaseRequest } from '../gcsBaseRequest';
import { IRCallback2, IRCallback4 } from 'shute-technologies.common-and-utils';
import { GCSIRequestResponseArg } from './data/gcsIResquestResponseArg';
import { PCPDebugConsole } from '../../../helpers/pcpConsole';
import { GCSRRArgClientInitialize } from './gcsRequest_ClientInitialize';

export interface GCSRequest_GFJSOBNResponse extends GCSIRequestResponseArg {
  jsObject: {} | null;
  arguments: any;
}

export class GCSRequest_GetFileJSObjectByName extends GCSBaseRequest<GCSRequest_GFJSOBNResponse> {
  private _arguments: any;

  constructor(private readonly _gcsUserDrive: GoogleDriveProxy) {
    super(_gcsUserDrive);
  }

  request(
    fileName: string, 
    folderId: string, 
    onCallbackResponse: IRCallback2<boolean, GCSRequest_GFJSOBNResponse>,
    args: { 
      callback?: IRCallback4<{}, string, string, any>; 
      extraArgs?: { 
        callback: (arg0: null, arg1: any, arg2: any, arg3: any) => void;
      }; 
      requestedFileName: string; 
      requestedFolderId: string; 
    } | undefined
  ): void {
    this._arguments = args;
    this._onCallbackResponse = onCallbackResponse;
    this._gcsUserDrive.existsFileInFolderByName(fileName, folderId, (a0, a1) => this.onResult_ExistsFile(a0, a1));
  }

  private onResult_ExistsFile(existsFile: boolean | undefined, fileId: string): void {
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

  override destroy(): void {
    super.destroy();
    this._arguments = null;
  }
}
