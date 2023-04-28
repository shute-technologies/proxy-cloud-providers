import { GoogleDriveProxy } from '../googleDriveProxy';
import { GCSBaseRequest } from '../gcsBaseRequest';
import { ICallback2 } from 'shute-technologies.common-and-utils';
import { GCSIRequestResponseArg } from './data/gcsIResquestResponseArg';

export interface GCSRequest_DeleteFileResponse extends GCSIRequestResponseArg {
  errorCode: number;
  success: boolean;
  arguments: any;
}

export class GCSRequest_DeleteFile extends GCSBaseRequest {
  private _arguments: any;

  constructor(private readonly _gcsUserDrive: GoogleDriveProxy) {
    super(_gcsUserDrive);
  }

  request(fileId: string, onCallbackResponse: ICallback2<boolean, GCSRequest_DeleteFileResponse>, args: any): void {
    this._arguments = args;
    this._onCallbackResponse = onCallbackResponse;

    const request = this._googleApi.client.drive.files.delete({ fileId: fileId });
    request.execute((response) => {
      if (this._onCallbackResponse) {
        const result = {
          arguments: this._arguments
        } as GCSRequest_DeleteFileResponse;

        if (response['error']) {
          result.errorCode = response.code;
          result.errorReason = response.error;
          result.success = false;
        } else {
          result.success = true;
        }

        this._onCallbackResponse(result.success, result);
      }

      this.doFinishRequest();
    });
  }

  destroy(): void {
    this._arguments = null;
    super.destroy();
  }
}
