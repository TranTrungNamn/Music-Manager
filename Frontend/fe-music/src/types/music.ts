export interface Artist {
  id: number;
  name: string;
  albums?: Album[];
}

export interface Album {
  id: number;
  title: string;
  artist: Artist;
  tracks?: Track[];
}

export interface Track {
  id: number;
  title: string;
  duration?: number;
}
