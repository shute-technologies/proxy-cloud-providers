import { GCSRequest_ClientInitialize } from './requests/gcsRequest_ClientInitialize';
import { GCSBaseRequest } from './gcsBaseRequest';
import { TIGoogleApi } from './typings-interfaces/ti-google-api';
import { TIGOATokenClient, TIGOATokenResponse, TIGoogleOAuth2 } from './typings-interfaces/ti-google-oauth2';
import { GCSConfig } from './config/gcsConfig';
import { GCSRequest_GetPersonalInfo, GCSRequest_GPIResponse, GCSRequest_GPIResponseUser, GCSRequest_GPIResponseStorageQuota } from './requests/gcsRequest_GetPersonalInfo';
import { GCSRequest_ExistsFileByName, GCSRequest_EFBNResponse } from './requests/gcsRequest_ExistsFileByName';
import { GCSRequest_ExistsFileInFolderByName, GCSRequest_EFIFBNResponse } from './requests/gcsRequest_ExistsFileInFolderByName';
import { GCSRequest_ListFilesFromRoot } from './requests/gcsRequest_ListFilesFromRoot';
import { GCSRequest_ListFilesByQuery } from './requests/gcsRequest_ListFilesByQuery';
import { GCSRequest_GetFileJSObjectByName } from './requests/gcsRequest_GetFileJSObjectByName';
import { GCSRequest_CreateFolder, GCSRequest_CFolderResultParameter } from './requests/gcsRequest_CreateFolder';
import { GCSRequest_CreateFileFromJSObject, GCSRequest_CFFJSOResultParameter } from './requests/gcsRequest_CreateFileFromJSObject';
import { GCSRequest_UpdateFileFromJSObject, GCSRequest_UFFJSOResultParameter } from './requests/gcsRequest_UpdateFileFromJSObject';
import { GCSEnumMimeType } from './enums/gcsEnumMimeTypes';
import { GCSRequest_CreateFile, GCSRequest_CFileResultParameter } from './requests/gcsRequest_CreateFile';
import { GCSRequest_UpdateFile, GCSRequest_UFileResultParameter } from './requests/gcsRequest_UpdateFile';
import { GCSRequest_UploadImage, GCSRequest_UploadImageResultParameter } from './requests/gcsRequest_UploadImage';
import { GCSRequest_DeleteFileFromFolder } from './requests/gcsRequest_DeleteFileFromFolder';
import { GCSRequest_GetFile, GCSRequest_GetFileResultParameter } from './requests/gcsRequest_GetFile';
import { GCSRequest_DeleteFile, GCSRequest_DeleteFileResponse } from './requests/gcsRequest_DeleteFile';
import { PCPDebugConsole } from '../../helpers/pcpConsole';
import { IRCallback1, IRCallback2, IRCallback3, IRCallback4 } from 'shute-technologies.common-and-utils';
import { GCSIRequestResponseArg } from './requests/data/gcsIResquestResponseArg';

declare const gapi: any;
declare const google: { accounts: { oauth2: TIGoogleOAuth2; }; };

export class GoogleDriveProxy {
  private _googleApi: TIGoogleApi;
  private _googleOAuth2: TIGoogleOAuth2;

  private _appClientId: string;
  private _appApiKey: string;
  private _appScopes: string;
  private _appDiscoveryDocs: string[];
  private _isSignedIn: boolean;
  private _tokenClient?: TIGOATokenClient;
  private _userToken?: TIGOATokenResponse;

  private _requests: Array<GCSBaseRequest<GCSIRequestResponseArg>>;
  private _userPersonalInfo?: GCSRequest_GPIResponseUser;
  private _userStorageQuota?: GCSRequest_GPIResponseStorageQuota;

  // callbacks
  callbackOnSignedIn?: IRCallback1<boolean>;

  get isSignedIn(): boolean { return this._isSignedIn; }
  get googleApi(): TIGoogleApi { return this._googleApi; }
  get userPersonalInfo(): GCSRequest_GPIResponseUser | undefined { return this._userPersonalInfo; }
  get userStorageQuota(): GCSRequest_GPIResponseStorageQuota | undefined { return this._userStorageQuota; }

  constructor(clientId: string, apiKey: string, scopes: string, appDiscoveryDocs: string[]) {
    this._appClientId = clientId;
    this._appApiKey = apiKey;
    this._appScopes = scopes;
    this._appDiscoveryDocs = appDiscoveryDocs;

    this._requests = [];
    this._isSignedIn = false;

    // reference the Google OAuth2 library
    this._googleOAuth2 = google.accounts.oauth2;
    this._googleApi = gapi as any;
  }

  loadClient(): void {
    this._tokenClient = this._googleOAuth2.initTokenClient({
      client_id: this._appClientId,
      scope: this._appScopes,
      callback: '', // defined later
    });

    // reference the GAPI library
    this._googleApi.load('client:auth2', () => this.initializeClient());

    PCPDebugConsole.log(this, 'Successful load of Google API.');
  }

  private initializeClient(): void {
    PCPDebugConsole.log(this, 'InitializeClient> Ok.');

    const requests = new GCSRequest_ClientInitialize(this);
    requests.request(this._appDiscoveryDocs, this._appApiKey, this._appScopes, (success: boolean, result) => {
      if (success) {
        (this._tokenClient as TIGOATokenClient).callback = async (resp: TIGOATokenResponse) => {
          this.onTokenClient(resp);
        };
        
        if (this._googleApi.client.getToken() === null) {
          // Prompt the user to select a Google Account and ask for consent to share their data
          // when establishing a new session.
          this._tokenClient?.requestAccessToken({prompt: 'consent'});
        } else {
          // Skip display of account chooser and consent dialog for an existing session.
          this._tokenClient?.requestAccessToken({prompt: ''});
        }
      } else {
        PCPDebugConsole.error(this, 'initializeClient> {0}', result?.errorReason?.details);
      }
    });

    // Add it to the Request
    this._requests.push(requests);
  }

  private onTokenClient(resp: TIGOATokenResponse) {
    if (resp.hasOwnProperty('error')) {
      PCPDebugConsole.error(this, 'initializeClient::tokenClient> {0}', resp.error);
      throw (resp);
    } else {
      this._userToken = resp;

      PCPDebugConsole.log(this, 'initializeClient::tokenClient> Ok');

      // Listen for sign-in state changes. [only listen]
      // this._googleApi.auth2.getAuthInstance().isSignedIn.listen((isSignedIn: boolean) => this.updateSignInStatus(isSignedIn));
      // Handle the initial sign-in state.
      this.updateSignInStatus(true);
    }
  }

  clearRequest<T extends GCSIRequestResponseArg>(request: GCSBaseRequest<T>): void {
    if (this._isSignedIn) {
      for (let i = 0; i < this._requests.length; i++) {
        if (this._requests[i].uid === request.uid) {
          this._requests[i].destroy();
          this._requests.splice(i, 1);
          break;
        }
      }
    } else {
      PCPDebugConsole.warn(this, 'clearRequest> You must signIn!!');
    }
  }

  // Called when the signed in status changes, to update the UI
  // appropriately. After a sign-in, the API is called.
  updateSignInStatus(isSignedIn: boolean): void {
    this._isSignedIn = isSignedIn;

    if (this._isSignedIn) {
      // This get Personal Info and Storage Quota
      const requests = new GCSRequest_GetPersonalInfo(this);
      requests.request('user, storageQuota', (success: boolean, result: GCSRequest_GPIResponse) => {
        if (success) {
          this._userPersonalInfo = result.user;
          this._userStorageQuota = result.storageQuota;

          // On Signed In
          if (this.callbackOnSignedIn) {
            this.callbackOnSignedIn(isSignedIn);
          }
        } else {
          // On Failed Signed In
          if (this.callbackOnSignedIn) {
            this.callbackOnSignedIn(false);
          }

          PCPDebugConsole.error(this, 'updateSignInStatus> ', result as any);
        }
      });

      // Add it to the Request
      this._requests.push(requests as GCSBaseRequest<GCSIRequestResponseArg>);
    } else {
      // On Signed In
      if (this.callbackOnSignedIn) {
        this.callbackOnSignedIn(false);
      }
    }
  }

  signIn(): void {
    if (!this._isSignedIn) {
      this._googleApi.auth2.getAuthInstance().signIn();
    } else {
      PCPDebugConsole.warn(this, 'signIn> You are already SignedIn!');
    }
  }

  signOut(): void {
    if (this._isSignedIn) {
      this._googleApi.auth2.getAuthInstance().signOut();
    } else {
      PCPDebugConsole.warn(this, 'signOut> You must signIn to signOut!');
    }
  }

  existsFileByName(fileName: string, onCallbackResult?: IRCallback2<boolean, string>) {
    if (this._isSignedIn) {
      const requests = new GCSRequest_ExistsFileByName(this);
      requests.request(
        fileName,
        (success, response: GCSRequest_EFBNResponse) => {
          if (success) {
            if (response.arguments) {
              response.arguments(response.existsFile, response.fileId);
            }
          } else {
            if (response.arguments) {
              response.arguments(false, null);
            }

            PCPDebugConsole.error(this, 'existsFileByName>', response.errorReason);
          }
        },
        onCallbackResult
      );

      // Add it to the Request
      this._requests.push(requests as GCSBaseRequest<GCSIRequestResponseArg>);
    } else {
      PCPDebugConsole.warn(this, 'existsFileByName> You must signIn!');
    }
  }

  existsFileInFolderByName(fileName: string, folderId: string, onCallbackResult?: IRCallback3<boolean, string, any>, extraArgs?: any): void {
    if (this._isSignedIn) {
      const requests = new GCSRequest_ExistsFileInFolderByName(this);
      requests.request(
        fileName,
        folderId,
        (success, response: GCSRequest_EFIFBNResponse) => {
          if (success) {
            if (response.arguments && response.arguments.callback) {
              response.arguments.callback(response.existsFile, response.fileId, response.arguments.extraArgs);
            }
          } else {
            if (response.arguments) {
              response.arguments(false, null);
            }

            PCPDebugConsole.error(this, 'existsFileInFolderByName>', response.errorReason);
          }
        },
        { callback: onCallbackResult, extraArgs }
      );

      // Add it to the Request
      this._requests.push(requests as GCSBaseRequest<GCSIRequestResponseArg>);
    } else {
      PCPDebugConsole.warn(this, 'existsFileInFolderByName> You must signIn!');
    }
  }

  listFilesFromRoot(onCallbackResult: IRCallback1<any>): void {
    if (this._isSignedIn) {
      const requests = new GCSRequest_ListFilesFromRoot<IRCallback1<any>>(this);
      requests.request((success, response) => {
        if (success) {
          if (response.arguments) {
            response.arguments(response.response ? response.response : response.errorReason);
          }
        } else {
          if (response.arguments) {
            response.arguments(null);
          }

          PCPDebugConsole.error(this, 'listFilesFromRoot>', response.errorReason);
        }
      }, onCallbackResult);

      // Add it to the Request
      this._requests.push(requests as GCSBaseRequest<GCSIRequestResponseArg>);
    } else {
      PCPDebugConsole.warn(this, 'listFilesFromRoot> You must signIn!');
    }
  }

  listFilesByQuery(queryObject: any, onCallbackResult: IRCallback3<boolean, any, any>, args?: { extraArgs: any; }): void {
    if (this._isSignedIn) {
      const requests = new GCSRequest_ListFilesByQuery(this);
      requests.request(
        queryObject,
        (success, response) => {
          if (success) {
            if (response.arguments && response.arguments.callback) {
              response.arguments.callback(true, response, response.arguments.extraArgs);
            }
          } else {
            if (response.arguments && response.arguments.callback) {
              response.arguments.callback(false, response.errorReason, args?.extraArgs);
            }

            PCPDebugConsole.error(this, 'listFilesByQuery>', response.errorReason);
          }
        },
        { callback: onCallbackResult, extraArgs: args }
      );

      // Add it to the Request
      this._requests.push(requests as GCSBaseRequest<GCSIRequestResponseArg>);
    } else {
      PCPDebugConsole.warn(this, 'listFilesByQuery> You must signIn!');
    }
  }

  getFileJSObjectByName(
    fileName: string,
    folderId: string,
    onCallbackResult?: IRCallback4<{}, string, string, any>, 
    args?: { 
      callback: (arg0: null, arg1: any, arg2: any, arg3: any) => void;
    }
  ): void {
    if (this._isSignedIn) {
      const requests = new GCSRequest_GetFileJSObjectByName(this);
      requests.request(
        fileName,
        folderId,
        (success, response) => {
          if (success) {
            if (response.arguments && response.arguments.callback) {
              response.arguments.callback(
                response.jsObject,
                response.arguments.requestedFileName,
                response.arguments.requestedFolderId,
                response.arguments.extraArgs
              );
            }
          } else {
            if (response.errorReason) {
              PCPDebugConsole.error(this, 'getFileJSObjectByName> ', response.errorReason);
            } else {
              if (args && args.callback) {
                args.callback(null, response.arguments.requestedFileName, response.arguments.requestedFolderId, response.arguments.extraArgs);
              }
            }
          }
        },
        {
          callback: onCallbackResult,
          requestedFileName: fileName,
          requestedFolderId: folderId,
          extraArgs: args,
        }
      );

      // Add it to the Request
      this._requests.push(requests as GCSBaseRequest<GCSIRequestResponseArg>);
    } else {
      PCPDebugConsole.warn(this, 'getFileJSObjectByName> You must signIn!');
    }
  }

  createFolder(
    folderName: string,
    parentFolder: string,
    onCreateCallbackWithResponse: IRCallback1<GCSRequest_CFolderResultParameter>,
    folderArgs: any
  ): GCSRequest_CreateFolder | null {
    let requestResult: GCSRequest_CreateFolder | null = null;

    if (this._isSignedIn) {
      requestResult = new GCSRequest_CreateFolder(this);
      requestResult.request(
        folderName,
        parentFolder,
        folderArgs,
        (success, response) => {
          if (success && response.arguments) {
            response.arguments(response.resultParameter);
          }
        },
        onCreateCallbackWithResponse
      );

      // Add it to the Request
      this._requests.push(requestResult as GCSBaseRequest<GCSIRequestResponseArg>);
    } else {
      PCPDebugConsole.warn(this, 'createFolder> You must signIn!');
    }

    return requestResult;
  }

  createFileFromJSObject(
    fileName: string,
    parentFolder: string,
    jsObject: {},
    onCreateCallbackWithResponse: IRCallback2<GCSRequest_CFFJSOResultParameter, any>,
    extraArgs?: any
  ): void {
    if (this._isSignedIn) {
      const requests = new GCSRequest_CreateFileFromJSObject(this);
      requests.request(
        fileName,
        parentFolder,
        jsObject,
        (success, response) => {
          if (success && response.arguments.callback) {
            response.arguments.callback(response.resultParameter, response.arguments.extraArgs);
          } else {
            PCPDebugConsole.error(this, 'createFileFromJSObject>', response.errorReason);
          }
        },
        { callback: onCreateCallbackWithResponse, extraArgs }
      );

      // Add it to the Request
      this._requests.push(requests as GCSBaseRequest<GCSIRequestResponseArg>);
    } else {
      PCPDebugConsole.warn(this, 'createFileFromJSObject> You must signIn!');
    }
  }

  updateFileFromJSObjectByFilename(
    fileName: string,
    folderId: string,
    jsObject: {},
    onCreateCallbackWithResponse: IRCallback3<boolean, GCSRequest_UFFJSOResultParameter, any>
  ): void {
    this.existsFileInFolderByName(
      fileName,
      folderId,
      (existsFile, fileId, extraArgs) => {
        if (existsFile) {
          this.updateFileFromJSObject(fileId, extraArgs.jsObject, extraArgs.callback);
        }
      },
      { callback: onCreateCallbackWithResponse, jsObject }
    );
  }

  updateFileFromJSObject(
    fileId: string,
    jsObject: {},
    onUpdateCallbackWithResponse: IRCallback3<boolean, GCSRequest_UFFJSOResultParameter, any>,
    extraArgs?: any
  ): void {
    if (this._isSignedIn) {
      const requests = new GCSRequest_UpdateFileFromJSObject(this);
      requests.request(
        fileId,
        jsObject,
        (success, response) => {
          if (success && response.arguments.callback) {
            response.arguments.callback(true, response.resultParameter, response.arguments.extraArgs);
          } else {
            if (response.arguments.callback) {
              response.arguments.callback(false, response.resultParameter, response.arguments.extraArgs);
            }
            PCPDebugConsole.error(this, 'updateFileFromJSObject>', response.errorReason);
          }
        },
        { callback: onUpdateCallbackWithResponse, extraArgs }
      );

      // Add it to the Request
      this._requests.push(requests as GCSBaseRequest<GCSIRequestResponseArg>);
    } else {
      PCPDebugConsole.warn(this, 'updateFileFromJSObject> You must signIn!');
    }
  }

  createFile(
    fileName: string,
    mimeType: GCSEnumMimeType,
    parentFolder: string,
    base64Data: string,
    onCreateCallbackWithResponse: IRCallback3<boolean, GCSRequest_CFileResultParameter, any>,
    extraArgs?: any
  ): void {
    if (this._isSignedIn) {
      const requests = new GCSRequest_CreateFile(this);
      requests.request(
        fileName,
        mimeType,
        parentFolder,
        base64Data,
        (success, response) => {
          if (success && response.arguments.callback) {
            response.arguments.callback(true, response.resultParameter, response.arguments.extraArgs);
          } else {
            response.arguments.callback(false, response.resultParameter, response.arguments.extraArgs);
          }
        },
        { callback: onCreateCallbackWithResponse, extraArgs }
      );

      // Add it to the Request
      this._requests.push(requests as GCSBaseRequest<GCSIRequestResponseArg>);
    } else {
      PCPDebugConsole.warn(this, 'createFile> You must signIn!');
    }
  }

  updateFile(
    fileId: string,
    mimeType: GCSEnumMimeType,
    base64Data: string,
    onUpdateCallbackWithResponse: IRCallback3<boolean, GCSRequest_UFileResultParameter, any>,
    extraArgs?: any,
    newFileName?: string
  ) {
    if (this._isSignedIn) {
      const requests = new GCSRequest_UpdateFile(this);
      requests.request(
        fileId,
        mimeType,
        base64Data,
        (success, response) => {
          if (success && response.arguments.callback) {
            response.arguments.callback(true, response.resultParameter, response.arguments.extraArgs);
          } else {
            if (response.arguments.callback) {
              response.arguments.callback(false, response.resultParameter, response.arguments.extraArgs);
            }

            PCPDebugConsole.error(this, 'updateFile> On error: ', response.errorReason);
          }
        },
        { callback: onUpdateCallbackWithResponse, extraArgs },
        newFileName
      );

      // Add it to the Request
      this._requests.push(requests as GCSBaseRequest<GCSIRequestResponseArg>);
    } else {
      PCPDebugConsole.warn(this, 'updateFile> You must signIn!');
    }
  }

  uploadImage(
    fileName: string,
    mimeType: GCSEnumMimeType,
    parentFolder: string,
    base64Data: string,
    onCreateCallbackWithResponse: IRCallback1<GCSRequest_UploadImageResultParameter>,
    extraMetadata?: any
  ) {
    if (this._isSignedIn) {
      const requests = new GCSRequest_UploadImage(this);
      requests.request(
        fileName,
        mimeType,
        parentFolder,
        base64Data,
        (success, response) => {
          if (success) {
            response.arguments(response.resultParameter);
          } else {
            PCPDebugConsole.error(this, 'uploadImage>', response.errorReason);
          }
        },
        onCreateCallbackWithResponse,
        extraMetadata
      );

      // Add it to the Request
      this._requests.push(requests as GCSBaseRequest<GCSIRequestResponseArg>);
    } else {
      PCPDebugConsole.warn(this, 'uploadImage> You must signIn!');
    }
  }

  deleteFile(fileId: string, onDeleteCallbackWithResponse: IRCallback1<GCSRequest_DeleteFileResponse>) {
    if (this._isSignedIn) {
      const requests = new GCSRequest_DeleteFile(this);
      requests.request(
        fileId,
        (sucess, response) => {
          if (sucess) {
            response.arguments(response);
            PCPDebugConsole.log(this, `deleteFile> Succesfully deleted fileId: '${fileId}'`);
          } else {
            response.arguments(response);
            PCPDebugConsole.error(this, `deleteFile> Error on delete fileId: '${fileId}'`);
          }
        },
        onDeleteCallbackWithResponse
      );

      // Add it to the Request
      this._requests.push(requests as GCSBaseRequest<GCSIRequestResponseArg>);
    } else {
      PCPDebugConsole.warn(this, 'deleteFile> You must signIn!');
    }
  }

  deleteFileFromFolder(fileName: string, folderId: string, onDeleteCallbackWithResponse: IRCallback1<boolean>) {
    if (this._isSignedIn) {
      const requests = new GCSRequest_DeleteFileFromFolder(this);
      requests.request(
        fileName,
        folderId,
        (success, response) => {
          if (success) {
            response.arguments(true);
          } else {
            response.arguments(false);
            PCPDebugConsole.error(this, 'deleteFileFromFolder>');
          }
        },
        onDeleteCallbackWithResponse
      );

      // Add it to the Request
      this._requests.push(requests as GCSBaseRequest<GCSIRequestResponseArg>);
    } else {
      PCPDebugConsole.warn(this, 'deleteFileFromFolder> You must signIn!');
    }
  }

  getFile(fileId: string, onGetCallbackWithResponse: IRCallback3<boolean, GCSRequest_GetFileResultParameter, any>, args?: any): GCSRequest_GetFile | null {
    if (this._isSignedIn) {
      const request = new GCSRequest_GetFile(this);
      request.request(
        fileId,
        (success, response) => {
          if (success) {
            if (response.arguments && response.arguments.callback) {
              response.arguments.callback(true, response.resultParameter, response.arguments.extraArgs);
            }
          } else {
            if (response.arguments && response.arguments.callback) {
              response.arguments.callback(false, response.resultParameter, response.arguments.extraArgs);
            }

            // console.error("GoogleCloudStorage_UserDrive::GetFile> Error on: ", fileId);
          }
        },
        { callback: onGetCallbackWithResponse, extraArgs: args }
      );

      return request;
    } else {
      PCPDebugConsole.warn(this, 'getFile> You must signIn!');
    }

    return null;
  }
}
