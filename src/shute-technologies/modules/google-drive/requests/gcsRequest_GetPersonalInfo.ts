import { GoogleDriveProxy } from '../googleDriveProxy';
import { GCSBaseRequest } from '../gcsBaseRequest';
import { IRCallback2 } from 'shute-technologies.common-and-utils';
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

export class GCSRequest_GetPersonalInfo extends GCSBaseRequest<GCSRequest_GPIResponse> {

  constructor(gcsUserDrive: GoogleDriveProxy) {
    super(gcsUserDrive);
  }

  request(fields: string, onCallbackResponse: IRCallback2<boolean, GCSRequest_GPIResponse>): void {
    this._onCallbackResponse = onCallbackResponse;

    const request = this._googleApi.client.drive.about.get({ fields });
    request.execute((aboutResponse) => {
      // On Signed In
      if (this._onCallbackResponse) {
        this._onCallbackResponse(true, aboutResponse as GCSRequest_GPIResponse);
      }

      this.doFinishRequest();
    });
  }
}
