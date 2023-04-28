import { STUtils } from "shute-technologies.common-and-utils";
import { GenericCloudStorageRequestManager } from "../helpers/genericCloudStorageRequestManager";
import { GoogleDriveProxy } from "../modules/google-drive/googleDriveProxy";

export abstract class GCSIRequest {

  protected _uid: string;
  protected _googleApi;

  gcsReqManager: GenericCloudStorageRequestManager;

  get uid(): string { return this._uid; }

  constructor(googleDrive: GoogleDriveProxy) {
    this._uid = STUtils.createGuid();
    this._googleApi = googleDrive.googleApi;
  }

  abstract request(...args);
  abstract destroy();
}
