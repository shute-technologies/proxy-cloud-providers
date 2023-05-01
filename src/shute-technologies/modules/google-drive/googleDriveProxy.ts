import { google } from "googleapis";
import { GCSBaseRequest } from "./gcsBaseRequest";

export class GoogleDriveProxy {

  constructor () {
    this.login();
  }

  clearRequest(request: GCSBaseRequest): void {

  }

  async login() {
    const oauth2Client = new google.auth.OAuth2(
      '275475823924-sncevj5nbqmaim2ni90vuj7pf689jige.apps.googleusercontent.com',
      '4Sv9Eon92Ueqy0HTpKCUs0Ai',
      'http://localhost:5000'
    );

    const scopes = [
      'https://www.googleapis.com/auth/drive',
      'https://www.googleapis.com/auth/drive.file'
    ];
    
    const authorizeUrl = oauth2Client.generateAuthUrl({
      // 'online' (default) or 'offline' (gets refresh_token)
      access_type: 'offline',
      // If you only need one scope you can pass it as a string
      scope: scopes
    });

    // Exchange the authorization code for access token and refresh token
    const code = 'AUTHORIZATION_CODE';
    const { tokens } = await oauth2Client.getToken(code);
    oauth2Client.setCredentials(tokens);

    const drive = google.drive({
      version: 'v3',
      auth: oauth2Client,
    });
    
    // Example: list the files in the user's Google Drive
    const { data } = await drive.files.list();
    console.log(data.files);
  }
}