export interface TIGOAClientParameters {
  client_id: string;
  scope: string;
  callback: string;
}

export interface TIGOARequestAccessToken {
  prompt: string;
}

export interface TIGOATokenClient {
  callback: (resp) => Promise<void>;
  requestAccessToken(params: TIGOARequestAccessToken);
}

export interface TIGoogleOAuth2 {
  initTokenClient(params: TIGOAClientParameters);
}