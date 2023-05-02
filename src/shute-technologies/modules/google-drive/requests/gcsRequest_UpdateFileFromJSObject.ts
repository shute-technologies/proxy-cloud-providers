import { GoogleDriveProxy } from '../googleDriveProxy';
import { GCSBaseRequest } from '../gcsBaseRequest';
import { ICallback2 } from 'shute-technologies.common-and-utils';
import { GCSIRequestResponseArg } from './data/gcsIResquestResponseArg';
import { GCSEnumMimeType } from '../enums/gcsEnumMimeTypes';
import { PCPDebugConsole } from '../../../helpers/pcpConsole';

export interface GCSRequest_UFFJSOResponse extends GCSIRequestResponseArg {
  resultParameter: GCSRequest_UFFJSOResultParameter;
  arguments: any;
}

export interface GCSRequest_UFFJSOResultParameter {
  created: boolean;
  id: string;
  name: string;
  mimeType: GCSEnumMimeType;
  error: any;
}

export class GCSRequest_UpdateFileFromJSObject extends GCSBaseRequest {
  private _arguments: any;

  constructor(private readonly _gcsUserDrive: GoogleDriveProxy) {
    super(_gcsUserDrive);
  }

  request(fileId: string, jsObject: {}, onCallbackResponse: ICallback2<boolean, GCSRequest_UFFJSOResponse>, args) {
    this._arguments = args;
    this._onCallbackResponse = onCallbackResponse;

    const resultParameter = {
      created: false,
      id: fileId,
      // name: fileName,
      mimeType: GCSEnumMimeType.TextPlain,
      error: undefined,
    } as GCSRequest_UFFJSOResultParameter;

    let metaType = '';
    let bodyType = '';
    const base64Data = btoa(JSON.stringify(jsObject));

    //if (mimeType === GoogleCloudStorage_MimeTypes.TextPlain) {
    metaType = 'text/plain\r\n\r\n';
    bodyType = 'text/plain\r\n\r\n';
    //}

    const boundary = '-------314159265358979323846';
    const delimiter = '\r\n--' + boundary + '\r\n';
    const close_delim = '\r\n--' + boundary + '--';

    const metadata = {
      //'name': fileName,
      mimeType: metaType,
      fields: 'id',
      //'parents': [ parentFolder ]
    };

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
        resultParameter.id = response.id;
        resultParameter.created = true;

        if (this._onCallbackResponse) {
          this._onCallbackResponse(true, {
            resultParameter,
            arguments: this._arguments,
          } as GCSRequest_UFFJSOResponse);
        }

        this.doFinishRequest();
      },
      (errorReason) => {
        PCPDebugConsole.warn(this, '::exception', errorReason);

        resultParameter.created = false;
        resultParameter.error = errorReason;

        if (this._onCallbackResponse) {
          this._onCallbackResponse(false, {
            resultParameter,
            arguments: this._arguments,
          } as GCSRequest_UFFJSOResponse);
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
