export type SWItem = {
  title: string;
  poster_path: string;
  backdrop_path: string;
  tagline: string;
  overview: string;
  genres: string[];
  release_date?: string;
};

export type SWPost = {
  post: {
    uri: string;
    cid: string;

    author: {
      did: string;
      handle: string;
      displayName?: string;
      avatar?: string;
    };

    indexedAt: string;

    record: {
      $type: string;
      item: string;

      title?: string;
      text?: string;
      rating?: number;
    };

    likes?: number;

    metadata?: SWItem;

    crosspost?: {
      uri: string;
      likes?: number;
      reposts?: number;
      replies?: number;
    };
  };
};

export type SWPostRecord = {
  uri: string;
  cid: string;

  author_did: string;
  author_handle: string;
  author_displayName: string;
  author_avatar: string;

  indexedAt: string;

  record_type: string;

  record_item: string;

  record_createdAt?: string;
  record_updatedAt?: string;

  record_title?: string;
  record_text?: string;
  record_rating?: number;

  record_crosspost_uri?: string;

  crosspost_likes?: number;
  crosspost_reposts?: number;
  crosspost_replies?: number;

  record_likes?: number;
};
