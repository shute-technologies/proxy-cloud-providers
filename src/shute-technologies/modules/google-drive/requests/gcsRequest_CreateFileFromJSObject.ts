import { GoogleDriveProxy } from '../googleDriveProxy';
import { GCSBaseRequest } from '../gcsBaseRequest';
import { ICallback2 } from 'shute-technologies.common-and-utils';
import { GCSIRequestResponseArg } from './data/gcsIResquestResponseArg';
import { GCSEnumMimeType } from '../enums/gcsEnumMimeTypes';

export interface GCSRequest_CFFJSOResponse extends GCSIRequestResponseArg {
  resultParameter: GCSRequest_CFFJSOResultParameter;
  arguments: any;
}

export interface GCSRequest_CFFJSOResultParameter {
  created: boolean;
  id: string;
  name: string;
  mimeType: GCSEnumMimeType;
  error: any;
}

export class GCSRequest_CreateFileFromJSObject extends GCSBaseRequest {
  private _arguments: any;

  constructor(private readonly _gcsUserDrive: GoogleDriveProxy) {
    super(_gcsUserDrive);
  }

  request(fileName: string, parentFolder, jsObject: {}, onCallbackResponse: ICallback2<boolean, GCSRequest_CFFJSOResponse>, args): void {
    this._arguments = args;
    this._onCallbackResponse = onCallbackResponse;

    const resultParameter = {
      created: false,
      id: 0 as any,
      name: fileName,
      mimeType: GCSEnumMimeType.TextPlain,
      error: null,
    } as GCSRequest_CFFJSOResultParameter;

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
      name: fileName,
      mimeType: metaType,
      parents: [parentFolder],
    };

    const multipartRequestBody =
      delimiter + 'Content-Type: application/json\r\n\r\n' + JSON.stringify(metadata) + delimiter + 'Content-Type: ' + bodyType + '' + base64Data + close_delim;

    const request = this._googleApi.client.request({
      path: '/upload/drive/v3/files',
      method: 'POST',
      params: { uploadType: 'multipart' },
      headers: { 'Content-Type': 'multipart/form-data; boundary="' + boundary + '"' },
      body: multipartRequestBody,
    });

    request.execute((response) => {
      resultParameter.id = response.id;
      resultParameter.created = true;

      if (this._onCallbackResponse) {
        this._onCallbackResponse(true, {
          resultParameter,
          arguments: this._arguments,
        } as GCSRequest_CFFJSOResponse);
      }

      this.doFinishRequest();
    });
  }

  destroy(): void {
    this._arguments = null;
    super.destroy();
  }
}
