import { ICallback1 } from "shute-technologies.common-and-utils";

export interface TIGoogleApi {
  load(apiName: string, callback: gapi.CallbackOrConfig): void;

  // No `auth2`: Google retired it and the proxy no longer loads it.
  readonly client: TIGoogleApiClient;
}

/** @deprecated gapi.auth2 is retired and no longer loaded. Kept for source compatibility. */
export interface TIGoogleApiAuth {
  getAuthInstance(): TIGoogleApiAuthInstance;
}

export interface TIGoogleApiClient {
  init(args: {
    /**
     * The API Key to use.
     */
    apiKey?: string;
    /**
     * An array of discovery doc URLs or discovery doc JSON objects.
     */
    discoveryDocs?: string[];
    /**
     * The app's client ID, found and created in the Google Developers Console.
     */
    clientId?: string;
    /**
     * The scopes to request, as a space-delimited string.
     */
    scope?: string;

    hosted_domain?: string;
  }): Promise<void>;
  request(arg: TIGoogleApiClientRequestArg): TIGoogleApiRequest;
  setToken(token: TIGoogleApiClientToken | null): void;
  getToken(): TIGoogleApiClientToken | null;

  drive: TIGoogleApiDrive;
}

export interface TIGoogleApiClientToken {
  access_token: string;
}

export interface TIGoogleApiClientRequestArg {
  path: string;
  method: string;
  params: {
    uploadType: string
  };
  headers: {
    'Content-Type': string
  };
  body: any;
}

export interface TIGoogleApiRequest {
  execute(response: (args) => void): void;
  then(response: (args) => void, errorResponse: (args) => void): void;
}

/** @deprecated gapi.auth2 is retired and no longer loaded. Kept for source compatibility. */
export interface TIGoogleApiAuthInstance {
  readonly isSignedIn: TIGoogleApiListen;
  signIn(): void;
  signOut(): void;
}

export interface TIGoogleApiListen {
  get(): TIGoogleApiUser;
  listen(listener: ICallback1<boolean>);
}

export interface TIGoogleApiUser {}

export interface TIGoogleApiDrive {
  about: TIGoogleApiDriveAbout;
  files: TIGoogleApiFiles;
}

export interface TIGoogleApiDriveAbout {
  get(arg: { fields }): TIGoogleApiRequest;
}

export interface TIGoogleApiFiles { 
  list(arg: TIGoogleApiFilesObject): Promise<any>;
  get(arg: TIGoogleApiFilesGet): Promise<any>;
  create(arg: TIGoogleApiFilesCreate): Promise<any>;
  delete(arg: { fileId: string }): TIGoogleApiRequest;
}

export interface TIGoogleApiFilesObject {
  pageSize: number;
  fields: string;
  orderBy: string;
  q: string;
}

export interface TIGoogleApiFilesGet {
  fileId: string;
  alt: string;
}

export interface TIGoogleApiFilesCreate {
  resource: {};
  fields: string;
}
