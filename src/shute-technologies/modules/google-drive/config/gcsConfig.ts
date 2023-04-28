import { GCSEnumMimeType } from '../enums/gcsEnumMimeTypes';
import { TIGoogleApiFilesObject } from '../typings-interfaces/ti-google-api';

export class GCSConfig {
  
  // Client ID and API key from the Developer Console
  static readonly CLIENT_ID = '275475823924-sncevj5nbqmaim2ni90vuj7pf689jige.apps.googleusercontent.com';
  // Array of API discovery doc URLs for APIs used by the quickstart
  static readonly DISCOVERY_DOCS = ["https://www.googleapis.com/discovery/v1/apis/drive/v3/rest"];
  // Authorization scopes required by the API; multiple scopes can be included, separated by spaces.
  static readonly SCOPES = 'https://www.googleapis.com/auth/drive https://www.googleapis.com/auth/drive.file';

  // Search for Files: Queries
  static SFFQuery_AllFoldersInFolder (folderId: string) {
    return {
      'pageSize': 1000, // max range [1-1000]
      'fields': "nextPageToken, files(id, name, mimeType, parents)",
      'orderBy': "folder",
      'q': "mimeType = '" + GCSEnumMimeType.Folder + 
          "' and '" + folderId + "' in parents and trashed = false"
    };
}

  static SFFQuery_AllFilesInFolder (folderId: string) {
    return {
      'pageSize': 1000, // max range [1-1000]
      'fields': "nextPageToken, files(id, name, mimeType, parents, webContentLink)",
      'orderBy': "folder",
      'q': "'" + folderId + "' in parents and trashed = false"
    };
  }

  static SFFQuery_GetFileFromFolder (fileName: string, folderId: string) {
    return {
      'pageSize': 1, // max range [1-1000]
      'fields': "nextPageToken, files(id, name, mimeType, parents, webContentLink)",
      'orderBy': "folder",
      'q': "'" + folderId + "' in parents and name contains '" + fileName + "' and trashed = false"
    };
  }

  static SFFQuery_GetFile (fileName: string) {
    return {
      'pageSize': 1, // max range [1-1000]
      'fields': "nextPageToken, files(id, name, mimeType, parents, webContentLink)",
      'orderBy': "folder",
      'q': "name contains '" + fileName + "' and trashed = false"
    } as TIGoogleApiFilesObject;
  }

  static SFFQuery_AllFilesFromRoot () {
    return {
      'pageSize': 1000,
      'fields': "nextPageToken, files(id, name, mimeType, parents, webContentLink)",
      'orderBy': "folder",
      'q': "'root' in parents and trashed = false"
    };
  }

  // API Reference: Search for Files> how to query files
  // https://developers.google.com/drive/v3/web/search-parameters

  // API Reference: Search for Files> how to create the query object
  // https://developers.google.com/drive/v3/reference/files/list

  // API Reference: Upload Files> Overview
  // https://developers.google.com/drive/v3/web/manage-uploads
}
