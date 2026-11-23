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

  request(discoveryDocs: string[], onCallbackResponse: ICallback2<boolean, GCSRRArgClientInitialize>): void;
  /**
   * @deprecated `clientId` and `scope` are ignored. Passing them to gapi.client.init initialises the
   * retired gapi.auth2; sign in with Google Identity Services instead.
   */
  request(discoveryDocs: string[], clientId: string, scope: string, onCallbackResponse: ICallback2<boolean, GCSRRArgClientInitialize>): void;
  request(discoveryDocs: string[], ...rest: any[]): void {
    this._onCallbackResponse = rest[rest.length - 1];

    this._googleApi.client
      .init({ discoveryDocs })
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
