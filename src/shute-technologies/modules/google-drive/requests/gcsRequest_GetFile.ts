import { GoogleDriveProxy } from '../googleDriveProxy';
import { GCSBaseRequest } from '../gcsBaseRequest';
import { IRCallback2 } from 'shute-technologies.common-and-utils';
import { GCSIRequestResponseArg } from './data/gcsIResquestResponseArg';

export interface GCSRequest_GetFileResultParameter {
  exists: boolean;
  id?: string;
  fileData?: string;
  error?: any;
  args?: any;
}

export interface GCSRequest_GetFileResponse extends GCSIRequestResponseArg {
  resultParameter: GCSRequest_GetFileResultParameter;
  arguments: any;
}

export class GCSRequest_GetFile extends GCSBaseRequest<GCSRequest_GetFileResponse> {
  //var mOnGetCallbackWithResponse;
  //var mFileMetadata;
  //var mResultParameter;

  private _fileId: string | undefined;
  private _arguments: any;
  private _fileMetadata: {
    fileId: string;
    alt: string;
  } | undefined;
  private _resultParameter: GCSRequest_GetFileResultParameter;

  // Try Again: Variables
  private _keepTrying: boolean;
  private _trying_counts: number;
  private _keepTrying_CountLimit: number;

  constructor(private readonly _gcsUserDrive: GoogleDriveProxy) {
    super(_gcsUserDrive);

    this._keepTrying = true;
    this._trying_counts = -1;
    this._keepTrying_CountLimit = 3;
    this._resultParameter = {
      exists: false,
      id: undefined,
      fileData: undefined,
      error: null,
      args: null
    };
  }

  request(fileId: string, onGetCallbackWithResponse: IRCallback2<boolean, GCSRequest_GetFileResponse>, args: any): void {
    this._fileId = fileId;
    this._arguments = args;
    this._onCallbackResponse = onGetCallbackWithResponse;

    this._fileMetadata = {
      fileId,
      alt: 'media',
    };

    // Do request
    this.doRequest();
  }

  private doRequest(): void {
    // { resource: mFileMetadata, fileId: fileId, alt: 'media' }
    this._googleApi.client.drive.files
      .get(this._fileMetadata)
      .then(
        this.onProcessResponse,
        this.onProcessError
      );
  }

  private onProcessResponse(response: { body: string }): void {
    let fileRawBody = response.body;

    // Remove encoding usually: base64
    const constSize = 'base64'.length;
    let contentStartIndex = fileRawBody.indexOf('base64');
    contentStartIndex = contentStartIndex === -1 ? 0 : contentStartIndex + constSize;
    fileRawBody = fileRawBody.substring(contentStartIndex);
    fileRawBody = fileRawBody.trim();

    this._resultParameter.exists = true;
    this._resultParameter.fileData = fileRawBody;

    if (this._onCallbackResponse) {
      this._onCallbackResponse(true, {
         resultParameter: this._resultParameter,
         arguments: this._arguments
      } as GCSRequest_GetFileResponse);
    }

    this.doFinishRequest();
  }

  private onProcessError(errorReason: any) {
    const canKeepTrying = this.tryAgain(this, errorReason, 1000);

    if (!canKeepTrying) {
      if (this._onCallbackResponse) {
        this._onCallbackResponse(false, {
          resultParameter: this._resultParameter,
          arguments: this._arguments
       } as GCSRequest_GetFileResponse);
      }

      this.doFinishRequest();
    }
  }

  // ANALIZE: Move this logic to GCSBaseRequest, so all request have the Try Again functionallity
  private tryAgain(instance: GCSRequest_GetFile, errorReason: { status: number }, waitTime: number): boolean {
    // Try Again: Variables
    if (instance._trying_counts === -1) {
      instance._trying_counts = 0;
      instance._keepTrying_CountLimit = 3;
    }

    const resultCanKeepTrying = instance._trying_counts++ < instance._keepTrying_CountLimit;

    if (resultCanKeepTrying) {
      setTimeout(
        (instance: GCSRequest_GetFile, errorReason: { status: number }) => {
          // var hasInternetConnection = NSharedUtil.IsServerHostReachable();

          switch (errorReason.status) {
            case 403: // Forbidden: Max rate limit
              instance.doRequest();
              break;
          }
        },
        waitTime,
        instance,
        errorReason
      );
    }

    return resultCanKeepTrying;
  }

  override destroy(): void {
    this._arguments = null;
    this._keepTrying = false;

    super.destroy();
  }
}
