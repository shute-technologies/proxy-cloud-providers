import { GoogleDriveProxy } from '../googleDriveProxy';
import { GCSBaseRequest } from '../gcsBaseRequest';
import { ICallback2 } from 'shute-technologies.common-and-utils';
import { GCSIRequestResponseArg } from './data/gcsIResquestResponseArg';
import { GCSEnumMimeType } from '../enums/gcsEnumMimeTypes';
import { PCPDebugConsole } from '../../../helpers/pcpConsole';

export interface GCSRequest_CFolderResultParameter {
  created: boolean;
  id: string;
  name: string;
  parentFolder;
  mimeType: GCSEnumMimeType;
  error: any;
  args: any;
}

export interface GCSRequest_CFResponse extends GCSIRequestResponseArg {
  resultParameter: GCSRequest_CFolderResultParameter;
  arguments: any;
}

export class GCSRequest_CreateFolder extends GCSBaseRequest {
  
  private _arguments: any;
  private _fileMetadata: {
    name: string;
    mimeType: GCSEnumMimeType;
    parents: string[]
  };
  private _resultParameter: GCSRequest_CFolderResultParameter;

  // Try Again: Variables
  private _keepTrying: boolean;

  constructor(private readonly _gcsUserDrive: GoogleDriveProxy) {
    super(_gcsUserDrive);

    this._keepTrying = true;
  }

  request(folderName: string, parentFolder: string, folderArgs, onCallbackResponse: ICallback2<boolean, GCSRequest_CFResponse>, args): void {
    this._arguments = args;
    this._onCallbackResponse = onCallbackResponse;

    this._fileMetadata = {
      name: folderName,
      mimeType: GCSEnumMimeType.Folder,
      parents: [],
    };

    if (parentFolder) {
      this._fileMetadata.parents.push(parentFolder);
    }

    this._resultParameter = {
      created: false,
      id: 0 as any,
      name: folderName,
      parentFolder: parentFolder,
      mimeType: GCSEnumMimeType.Folder,
      error: null,
      args: folderArgs,
    } as GCSRequest_CFolderResultParameter;

    this._googleApi.client.drive.files.create({ resource: this._fileMetadata, fields: 'id' }).then(
      (response) => {
        this._resultParameter.id = response.result.id;
        this._resultParameter.created = true;

        if (this._onCallbackResponse) {
          this._onCallbackResponse(true, {
            resultParameter: this._resultParameter, 
            arguments: this._arguments
          } as GCSRequest_CFResponse);
        }

        this.doFinishRequest();
      },
      (errorReason) => {
        PCPDebugConsole.warn(this, '::exception', errorReason);

        //var hasInternetConnection = NSharedUtil.IsServerHostReachable();

        if (this._keepTrying) {
          this.tryAgain(1000);
        }

        //if (hasInternetConnection) {
        if (this._onCallbackResponse) {
          this._onCallbackResponse(false, {
            resultParameter: this._resultParameter, 
            arguments: this._arguments
          } as GCSRequest_CFResponse);
        }

        this.doFinishRequest();
        //}
      }
    );
  }

  private tryAgain(waitTime: number) {}

  destroy(): void {
    this._arguments = null;
    this._resultParameter = null;
    this._fileMetadata = null;
    this._keepTrying = false;

    super.destroy();
  }
}
