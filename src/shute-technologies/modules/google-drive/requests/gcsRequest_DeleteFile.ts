import { GoogleDriveProxy } from '../googleDriveProxy';
import { GCSBaseRequest } from '../gcsBaseRequest';
import { IRCallback2 } from 'shute-technologies.common-and-utils';
import { GCSIRequestResponseArg } from './data/gcsIResquestResponseArg';

export interface GCSRequest_DeleteFileResponse extends GCSIRequestResponseArg {
  errorCode: number;
  success: boolean;
  arguments: any;
}

export class GCSRequest_DeleteFile extends GCSBaseRequest<GCSRequest_DeleteFileResponse> {
  private _arguments: any;

  constructor(gcsUserDrive: GoogleDriveProxy) {
    super(gcsUserDrive);
  }

  request(fileId: string, onCallbackResponse: IRCallback2<boolean, GCSRequest_DeleteFileResponse>, args: any): void {
    this._arguments = args;
    this._onCallbackResponse = onCallbackResponse;

    const request = this._googleApi.client.drive.files.delete<{ error: string, code: number }>({ fileId: fileId });
    request.execute((response) => {
      if (this._onCallbackResponse) {
        const result = {
          arguments: this._arguments
        } as GCSRequest_DeleteFileResponse;

        if (response.error) {
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

  override destroy(): void {
    this._arguments = null;
    super.destroy();
  }
}
