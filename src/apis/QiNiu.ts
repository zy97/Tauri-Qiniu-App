import { invoke } from "@tauri-apps/api";
import { Download, QnFile, UploadStatus } from "../models/File";

export const getLists = (args?: { marker?: String, query?: String, pageSize?: number }) => {
    return invoke<QnFile[]>("get_lists", args);
}
export const downloadFile = (file: QnFile) => {
    return invoke<any>("download", { file });
}
export const uploadFile = (filePath: string) => {
    return invoke<UploadStatus>("upload_file", { filePath });
}
export const getdownloadLists = () => {
    return invoke<Download[]>("get_download_files", {});
}
export const deleteDownloadFile = (data: Download) => {
    return invoke<any>("delete_download_file", { data });
}
export const deleteFile = (key: string) => {
    return invoke<any>("delete_file", { key });
}