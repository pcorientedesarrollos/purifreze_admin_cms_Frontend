export interface CmsVideo {
  id: string;
  title: string;
  url: string;
  vertical: boolean;
  isVisible: boolean;
}

export interface UploadedVideo {
  filename: string;
  url: string;
}
