import { invoke } from "@tauri-apps/api";
import { LocalFile, QnFile } from "../models/File";

export const getLists = (args?: { marker?: String, query?: String, pageSize?: number }) => {
    return invoke<QnFile[]>("get_lists", args);
}
export const downloadFile = (file: QnFile) => {
    return invoke<any>("download", { "fileInfo": file });
}

export const getdownloadLists = () => {
    return invoke<LocalFile[]>("get_download_files", {});
}