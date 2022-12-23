export const transformFileType = (fileType: string) => {
    switch (fileType) {
        case "application/vnd.ms-excel":
            return "excel"
        case "application/x-msdownload":
            return "exe"
        case "image/gif":
            return "gif"
        case "application/x-msi":
            return "msi"
        case "image/png":
        case "image/jpeg":
            return "photo"
        case "application/x-httpd-php":
            return "php"
        case "text/plain":
            return "txt"
        case "video/mp4":
            return "video"
        default:
            return "unknown"
    }
};