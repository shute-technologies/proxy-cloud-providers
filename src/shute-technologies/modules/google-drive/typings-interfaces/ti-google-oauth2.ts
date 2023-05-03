export interface TIGOAClientParameters {
  client_id: string;
  scope: string;
  callback: string;
}

export interface TIGOARequestAccessToken {
  prompt: string;
}

export interface TIGOATokenResponse {
  access_token: string;
  authuser: string;
  expires_in: number;
  prompt: string;
  scope: string;
  token_type: string;
  error;
}

export interface TIGOATokenClient {
  callback: (resp: TIGOATokenResponse) => Promise<void>;
  requestAccessToken(params: TIGOARequestAccessToken);
}

export interface TIGoogleOAuth2 {
  initTokenClient(params: TIGOAClientParameters);
}