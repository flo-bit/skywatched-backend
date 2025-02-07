import { env } from "bun";
import { getRecentRecordsByItemRef } from "./database";

export type Kind = "movie" | "tv";

export async function searchMulti(query: string) {
  const apiUrl = `https://api.themoviedb.org/3/search/multi?query=${query}&include_adult=false&language=en-US&page=1`;
  const options = {
    method: "GET",
    headers: {
      accept: "application/json",
      Authorization: `Bearer ${env.TMDB_API_KEY}`,
    },
  };

  const response = await fetch(apiUrl, options);
  const data = await response.json();

  return data.results;
}

export async function getDetails(id: number, kind: Kind) {
  const url = `https://api.themoviedb.org/3/${kind}/${id}?language=en-US`;
  const options = {
    method: "GET",
    headers: {
      accept: "application/json",
      Authorization: `Bearer ${env.TMDB_API_KEY}`,
    },
  };

  const response = await fetch(url, options);
  const data = await response.json();

  return data;
}

export async function getTrailer(
  id: number,
  kind: Kind
): Promise<string | null> {
  const url = `https://api.themoviedb.org/3/${kind}/${id}/videos?language=en-US`;
  const options = {
    method: "GET",
    headers: {
      accept: "application/json",
      Authorization: `Bearer ${env.TMDB_API_KEY}`,
    },
  };

  const response = await fetch(url, options);
  const data = await response.json();

  let trailer = data.results?.find(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (video: any) =>
      video.site === "YouTube" && video.type === "Trailer" && video.official
  );

  if (!trailer) {
    trailer = data.results?.find(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (video: any) => video.site === "YouTube" && video.type === "Trailer"
    );
  }

  return trailer?.key ?? null;
}

export async function getRecommendations(id: number, kind: Kind) {
  const url = `https://api.themoviedb.org/3/${kind}/${id}/recommendations?language=en-US`;
  const options = {
    method: "GET",
    headers: {
      accept: "application/json",
      Authorization: `Bearer ${env.TMDB_API_KEY}`,
    },
  };

  const response = await fetch(url, options);
  const data = await response.json();

  return data.results;
}

export async function getWatchProviders(id: number, kind: Kind) {
  const url = `https://api.themoviedb.org/3/${kind}/${id}/watch/providers?language=en-US`;
  const options = {
    method: "GET",
    headers: {
      accept: "application/json",
      Authorization: `Bearer ${env.TMDB_API_KEY}`,
    },
  };

  const response = await fetch(url, options);
  const data = await response.json();

  return data.results;
}

export async function getCast(id: number, kind: Kind) {
  const url = `https://api.themoviedb.org/3/${kind}/${id}/credits?language=en-US`;
  const options = {
    method: "GET",
    headers: {
      accept: "application/json",
      Authorization: `Bearer ${env.TMDB_API_KEY}`,
    },
  };

  const response = await fetch(url, options);
  const data = await response.json();

  return data.cast;
}

export async function getItemDetails(ref: string) {
  const id = parseInt(ref.split("-")[1]);
  const kind = ref.split("-")[0].split(":")[1] === "m" ? "movie" : "tv";

  const resultPromise = getDetails(id, kind);

  const trailerPromise = getTrailer(id, kind);

  const recommendationsPromise = getRecommendations(id, kind);

  const watchProvidersPromise = getWatchProviders(id, kind);

  const castPromise = getCast(id, kind);

  const [result, trailer, recommendations, watchProviders, cast] =
    await Promise.all([
      resultPromise,
      trailerPromise,
      recommendationsPromise,
      watchProvidersPromise,
      castPromise,
    ]);

  if (!result || result.success === false) {
    throw new Error("Not found");
  }

  const reviews = getRecentRecordsByItemRef(ref.split("-")[0], id.toString());

  return {
    ...{
      ...result,
      movieId: kind === "movie" ? id : undefined,
      showId: kind === "tv" ? id : undefined,
      ref: (kind === "movie" ? "tmdb:m-" : "tmdb:s-") + id,
    },
    trailer,
    recommendations: recommendations.map((item) => {
      return {
        ...item,
        ref: (kind === "movie" ? "tmdb:m-" : "tmdb:s-") + item.id,
      };
    }),
    kind,
    watchProviders,
    cast,
    reviews,
  };
}
