export interface CmsVideo {
  id: number;
  title: string;
  url: string;
  vertical: boolean;
  isVisible: boolean;
  sortOrder: number;
}

export interface UploadedVideo {
  filename: string;
  url: string;
}
