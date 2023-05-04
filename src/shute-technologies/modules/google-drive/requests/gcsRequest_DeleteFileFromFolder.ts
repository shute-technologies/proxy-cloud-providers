import { GoogleDriveProxy } from '../googleDriveProxy';
import { GCSBaseRequest } from '../gcsBaseRequest';
import { IRCallback2 } from 'shute-technologies.common-and-utils';
import { GCSIRequestResponseArg } from './data/gcsIResquestResponseArg';

export interface GCSRequest_DeleteFileFromFolderResponse extends GCSIRequestResponseArg {
  arguments: any;
}

export class GCSRequest_DeleteFileFromFolder extends GCSBaseRequest<GCSRequest_DeleteFileFromFolderResponse> {
  private _arguments: any;

  constructor(private readonly _gcsUserDrive: GoogleDriveProxy) {
    super(_gcsUserDrive);
  }

  request(fileName: string, folderId: string, onCallbackResponse: IRCallback2<boolean, GCSRequest_DeleteFileFromFolderResponse>, args: any): void {
    this._arguments = args;
    this._onCallbackResponse = onCallbackResponse;

    this._gcsUserDrive.existsFileInFolderByName(fileName, folderId, this.onResult_ExistsFileInFolderByName);
  }

  private onResult_ExistsFileInFolderByName(existsFile: boolean, fileId: string): void {
    if (existsFile) {
      const request = this._googleApi.client.drive.files.delete({ fileId });
      request.execute(() => {
        if (this._onCallbackResponse) {
          this._onCallbackResponse(true, {
            arguments: this._arguments,
          } as GCSRequest_DeleteFileFromFolderResponse);
        }

        this.doFinishRequest();
      });
    } else {
      if (this._onCallbackResponse) {
        this._onCallbackResponse(false, {
          arguments: this._arguments,
        } as GCSRequest_DeleteFileFromFolderResponse);
      }

      this.doFinishRequest();
    }
  }

  override destroy(): void {
    this._arguments = null;
    super.destroy();
  }
}
