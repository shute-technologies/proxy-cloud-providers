import { GoogleDriveProxy } from '../googleDriveProxy';
import { GCSBaseRequest } from '../gcsBaseRequest';
import { ICallback2 } from 'shute-technologies.common-and-utils';
import { GCSIRequestResponseArg } from './data/gcsIResquestResponseArg';
import { GCSEnumMimeType } from '../enums/gcsEnumMimeTypes';
import { PCPDebugConsole } from '../../../helpers/pcpConsole';

export interface GCSRequest_UFileResultParameter {
  created: boolean;
  id: string;
  newFileName: string;
  mimeType: GCSEnumMimeType;
  error: any;
}

export interface GCSRequest_UFileResponse extends GCSIRequestResponseArg {
  resultParameter: GCSRequest_UFileResultParameter;
  arguments: any;
}

export class GCSRequest_UpdateFile extends GCSBaseRequest {

  private _arguments: any;

  constructor(private readonly _gcsUserDrive: GoogleDriveProxy) {
    super(_gcsUserDrive);
  }

  request(
    fileId: string,
    mimeType: GCSEnumMimeType,
    base64Data: string,
    onCallbackResponse: ICallback2<boolean, GCSRequest_UFileResponse>,
    args,
    newFileName: string
  ): void {
    this._arguments = args;
    this._onCallbackResponse = onCallbackResponse;

    const resultParameter = {
      created: false,
      id: fileId,
      newFileName: newFileName,
      mimeType: mimeType,
      error: null,
    } as GCSRequest_UFileResultParameter;

    const metaType = mimeType + '\r\n\r\n';
    const bodyType = mimeType + '\r\n\r\n';
    const boundary = '-------314159265358979323846';
    const delimiter = '\r\n--' + boundary + '\r\n';
    const close_delim = '\r\n--' + boundary + '--';

    const metadata = {
      mimeType: metaType,
      fields: 'id',
    };

    if (newFileName) {
      metadata['name'] = newFileName;
    }

    const multipartRequestBody =
      delimiter + 'Content-Type: application/json\r\n\r\n' + JSON.stringify(metadata) + delimiter + 'Content-Type: ' + bodyType + '' + base64Data + close_delim;

    const request = this._googleApi.client.request({
      path: '/upload/drive/v3/files/' + fileId,
      method: 'PATCH',
      params: { uploadType: 'multipart' },
      headers: { 'Content-Type': 'multipart/form-data; boundary="' + boundary + '"' },
      body: multipartRequestBody,
    });

    request.then(
      (response) => {
        resultParameter.id = response.result.id;
        resultParameter.newFileName = response.result.name;
        resultParameter.created = true;

        if (this._onCallbackResponse) {
          this._onCallbackResponse(true, {
            resultParameter, 
            arguments: this._arguments
          } as GCSRequest_UFileResponse);
        }

        this.doFinishRequest();
      },
       (errorResponse) => {
        PCPDebugConsole.warn(this, '::exception', errorResponse);

        resultParameter.created = false;
        resultParameter.error = errorResponse;

        if (this._onCallbackResponse) {
          this._onCallbackResponse(false, {
            resultParameter, 
            arguments: this._arguments
          } as GCSRequest_UFileResponse);
        }

        this.doFinishRequest();
      }
    );
  }

  destroy(): void {
    this._arguments = null;
    super.destroy();
  }
}
