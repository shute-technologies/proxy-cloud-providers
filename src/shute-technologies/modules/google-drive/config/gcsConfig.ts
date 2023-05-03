import { GCSEnumMimeType } from '../enums/gcsEnumMimeTypes';
import { TIGoogleApiFilesObject } from '../typings-interfaces/ti-google-api';

export class GCSConfig {
  
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
