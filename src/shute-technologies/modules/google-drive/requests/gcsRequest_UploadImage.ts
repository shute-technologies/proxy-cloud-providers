import { GoogleDriveProxy } from '../googleDriveProxy';
import { GCSBaseRequest } from '../gcsBaseRequest';
import { ICallback2 } from 'shute-technologies.common-and-utils';
import { GCSIRequestResponseArg } from './data/gcsIResquestResponseArg';
import { GCSEnumMimeType } from '../enums/gcsEnumMimeTypes';

export interface GCSRequest_UploadImageResultParameter {
  created: boolean;
  id: string;
  name: string;
  mimeType: GCSEnumMimeType;
  error: any;
}

export interface GCSRequest_UploadImageResponse extends GCSIRequestResponseArg {
  resultParameter: GCSRequest_UploadImageResultParameter;
  arguments: any;
}

export class GCSRequest_UploadImage extends GCSBaseRequest {
  private _arguments: any;

  constructor(private readonly _gcsUserDrive: GoogleDriveProxy) {
    super(_gcsUserDrive);
  }

  request(
    fileName: string,
    mimeType: GCSEnumMimeType,
    parentFolder,
    base64Data: string,
    onCallbackResponse: ICallback2<boolean, GCSRequest_UploadImageResponse>,
    args,
    extraMetadata
  ): void {
    this._arguments = args;
    this._onCallbackResponse = onCallbackResponse;

    const resultParameter = {
      created: false,
      id: 0 as any,
      name: fileName,
      mimeType,
      error: null,
    } as GCSRequest_UploadImageResultParameter;

    let metaType = '';
    let bodyType = '';

    switch (mimeType) {
      case GCSEnumMimeType.PNG:
        metaType = 'image/png\r\n\r\n';
        bodyType = 'image/png\r\n\r\n';
        break;
      case GCSEnumMimeType.JPG:
      case GCSEnumMimeType.JPEG:
        metaType = 'image/jpeg\r\n\r\n';
        bodyType = 'image/jpeg\r\n\r\n';
        break;
    }

    const boundary = '-------314159265358979323846';
    const delimiter = '\r\n--' + boundary + '\r\n';
    const close_delim = '\r\n--' + boundary + '--';

    const metadata = {
      name: fileName,
      mimeType: metaType,
      parents: [parentFolder],
      appProperties: extraMetadata ? JSON.stringify(extraMetadata) : undefined,
    };

    let multipartRequestBody =
      delimiter + 'Content-Type: application/json\r\n\r\n' + JSON.stringify(metadata) + delimiter + 'Content-Type: ' + bodyType + '\r\n';

    //Transfer images as base64 string.
    if (bodyType.indexOf('image/') === 0) {
      const pos = base64Data.indexOf('base64,');
      multipartRequestBody += 'Content-Transfer-Encoding: base64\r\n' + '\r\n' + base64Data.slice(pos < 0 ? 0 : pos + 'base64,'.length);
    } else {
      multipartRequestBody += +'\r\n' + base64Data;
    }

    multipartRequestBody += close_delim;

    const request = this._googleApi.client.request({
      path: '/upload/drive/v3/files',
      method: 'POST',
      params: { uploadType: 'multipart' },
      headers: { 'Content-Type': 'multipart/form-data; boundary="' + boundary + '"' },
      body: multipartRequestBody,
    });

    request.execute(function (response) {
      resultParameter.id = response.id;
      resultParameter.created = true;

      if (this._onCallbackResponse) {
        this._onCallbackResponse(true, {
          resultParameter,
          arguments: this._arguments,
        } as GCSRequest_UploadImageResponse);
      }

      this.doFinishRequest();
    });
  }

  destroy(): void {
    this._arguments = null;
    super.destroy();
  }
}
