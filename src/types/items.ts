export type Ref = `tmdb:m-${number}` | `tmdb:s-${number}`;

export type Item = {
  id: number;

  ref: Ref;

  title: string;
  poster_path: string;
  backdrop_path: string;

  overview: string;

  release_date: string;
  first_air_date: string;
  media_type: "movie" | "tv";

  genre_ids: number[];

  vote_average: number;
  vote_count: number;

  popularity: number;

  original_title: string;
  original_language: string;

  video: boolean;
};

export type WatchProviders = Record<
  string,
  {
    link: string;
    flatrate: {
      logo_path: string;
      provider_name: string;
      provider_id: number;
      display_priority: number;
    }[];
  }
>;

export type Cast = {
  adult: boolean;
  gender: number;
  id: number;
  known_for_department: string;
  name: string;
  original_name: string;
  popularity: number;
  profile_path: string;
  character: string;
  credit_id: string;
  order: number;
};

export type DetailedItem = Item & {
  trailer_url?: string;

  recommendations: Item[];

  watch_providers: WatchProviders;

  cast: Cast[];
};
