export interface CmsVideo {
  id: number;
  title: string;
  url: string;
  placement: VideoPlacement;
  vertical: boolean;
  isVisible: boolean;
  sortOrder: number;
}

export type VideoPlacement = 'gallery' | 'uses';

export interface UploadedVideo {
  filename: string;
  url: string;
}
