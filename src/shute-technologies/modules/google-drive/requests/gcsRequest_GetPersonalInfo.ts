import { GoogleDriveProxy } from '../googleDriveProxy';
import { GCSBaseRequest } from '../gcsBaseRequest';
import { ICallback2 } from 'shute-technologies.common-and-utils';
import { GCSIRequestResponseArg } from './data/gcsIResquestResponseArg';

export interface GCSRequest_GPIResponse extends GCSIRequestResponseArg {
  user: GCSRequest_GPIResponseUser;
  storageQuota: GCSRequest_GPIResponseStorageQuota;
}

export interface GCSRequest_GPIResponseUser {
  kind: 'drive#user';
  displayName: string;
  photoLink: string;
  me: boolean;
  permissionId: string;
  emailAddress: string;
}

export interface GCSRequest_GPIResponseStorageQuota {
  limit: number;
  usage: number;
  usageInDrive: number;
  usageInDriveTrash: number;
}

export class GCSRequest_GetPersonalInfo extends GCSBaseRequest {

  constructor(private readonly _gcsUserDrive: GoogleDriveProxy) {
    super(_gcsUserDrive);
  }

  request(fields: string, onCallbackResponse: ICallback2<boolean, GCSRequest_GPIResponse>): void {
    this._onCallbackResponse = onCallbackResponse;

    const request = this._googleApi.client.drive.about.get({ fields });
    request.execute((aboutResponse) => {
      // On Signed In
      if (this._onCallbackResponse) {
        this._onCallbackResponse(true, aboutResponse);
      }

      this.doFinishRequest();
    });
  }
}
