import { GoogleDriveProxy } from '../googleDriveProxy';
import { GCSBaseRequest } from '../gcsBaseRequest';
import { GCSConfig } from '../config/gcsConfig';
import { GCSIRequestResponseArg } from './data/gcsIResquestResponseArg';
import { IRCallback2 } from 'shute-technologies.common-and-utils';

export interface GCSRequest_EFIFBNResponse extends GCSIRequestResponseArg {
  existsFile: boolean;
  fileId: string | null;
  arguments: any;
}

export class GCSRequest_ExistsFileInFolderByName extends GCSBaseRequest<GCSRequest_EFIFBNResponse> {
  private _arguments: any;

  constructor(private readonly _gcsUserDrive: GoogleDriveProxy) {
    super(_gcsUserDrive);
  }

  request(fileName: string, folderId: string, onCallbackResponse: IRCallback2<boolean, GCSRequest_EFIFBNResponse>, args: any): void {
    this._arguments = args;
    this._onCallbackResponse = onCallbackResponse;

    const queryObject = GCSConfig.SFFQuery_GetFileFromFolder(fileName, folderId);

    this._googleApi.client.drive.files.list(queryObject).then(
      (response) => {
        if (this._onCallbackResponse) {
          var existsFile = response.result.files && response.result.files.length > 0;
          var fileId = existsFile ? response.result.files[0].id : undefined;

          this._onCallbackResponse(true, {
            existsFile,
            fileId, 
            arguments: this._arguments
          } as GCSRequest_EFIFBNResponse);
        }

        this.doFinishRequest();
      },
      (reason) => {
        if (this._onCallbackResponse) {
          this._onCallbackResponse(false, {
            existsFile: false,
            fileId: null, 
            arguments: this._arguments,
            errorReason: reason
          } as GCSRequest_EFIFBNResponse);
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
