import { GoogleDriveProxy } from './googleDriveProxy';
import { TIGoogleApi } from './typings-interfaces/ti-google-api';
import { GCSIRequestResponseArg } from './requests/data/gcsIResquestResponseArg';
import { IRCallback2, STUtils } from 'shute-technologies.common-and-utils';
import { GenericCloudStorageRequestManager } from '../../helpers/genericCloudStorageRequestManager';

export abstract class GCSBaseRequest<IResponse extends GCSIRequestResponseArg> {

  protected _uid: string;
  protected _googleApi: TIGoogleApi;
  protected _onCallbackResponse: IRCallback2<boolean, IResponse> | undefined;

  gcsReqManager: GenericCloudStorageRequestManager | undefined;

  get uid(): string { return this._uid; }

  constructor(private readonly _abstractGCUserDrive: GoogleDriveProxy) {
    this._uid = STUtils.createGuid();
    this._googleApi = _abstractGCUserDrive.googleApi;
  }

  abstract request(...args: unknown[]): void;

  protected doFinishRequest(): void {
    // If have Request Manager then inform it finished
    if (this.gcsReqManager) { this.gcsReqManager.finishedRequest(this); }
    // Clear request
    this._abstractGCUserDrive.clearRequest(this);
  }

  destroy(): void {
    this._onCallbackResponse = undefined;
    this.gcsReqManager = undefined;
  }
}
