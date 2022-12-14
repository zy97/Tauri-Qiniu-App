export interface QnFile {
    hash: string;
    key: string;
    mime_type: string;
    size: string;
    marker: string;
    downloaded: boolean;
}
export interface Download {
    id: string,
    key: string,
    hash: string,
    size: string,
    mime_type: string,
    path: string,
    download_date: Date;
}

export interface DownloadEventPayload {
    progress: number,
    data: Download
}
export interface UploadEventPayload {
    progress: number,
    data: Upload
}
export interface Upload {
    id: string,
    path: string,
}
export enum UploadStatus {
    "Uploading" = "Uploading",
    "Uploaded" = "Uploaded",
    "DirNotSupport" = "DirNotSupport"
}
