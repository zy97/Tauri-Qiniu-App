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
}

export interface DownloadEventPayload {
    progress: number,
    data: Download
}
