import { invoke } from "@tauri-apps/api";
import { QnFile } from "../models/File";

export const getLists = (args?: { marker?: String, query?: String }) => {
    return invoke<any>("get_lists", args);
}
export const downloadFile = (file: QnFile) => {
    return invoke<any>("download", { "fileInfo": file });
}