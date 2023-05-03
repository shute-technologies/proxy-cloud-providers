import { GoogleDriveProxy } from '../googleDriveProxy';
import { GCSBaseRequest } from '../gcsBaseRequest';
import { ICallback2 } from 'shute-technologies.common-and-utils';
import { GCSIRequestResponseArg } from './data/gcsIResquestResponseArg';

export interface GCSRRArgClientInitialize extends GCSIRequestResponseArg {
  response?;
}

export class GCSRequest_ClientInitialize extends GCSBaseRequest {

  constructor(private readonly _gcsUserDrive: GoogleDriveProxy) {
    super(_gcsUserDrive);
  }

  request(discoveryDocs: string[], apiKey: string, scope: string, onCallbackResponse: ICallback2<boolean, GCSRRArgClientInitialize>): void {
    this._onCallbackResponse = onCallbackResponse;

    this._googleApi.client
      .init({
        discoveryDocs: discoveryDocs,
        apiKey: apiKey,
        scope: scope,
      })
      .then((response) => {
          if (this._onCallbackResponse) {
            this._onCallbackResponse(true, { response } as GCSRRArgClientInitialize);
          }

          this.doFinishRequest();
        },
        (errorReason) => {
          if (this._onCallbackResponse) {
            this._onCallbackResponse(false, { errorReason } as GCSRRArgClientInitialize);
          }

          this.doFinishRequest();
        }
      );
  }
}
