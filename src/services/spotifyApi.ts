import { SpotifyAuthError, getValidAccessToken } from "./spotifyAuth";
import { SpotifyTrack } from "../types";

const API_BASE = "https://api.spotify.com/v1";

// IMPORTANTE — sobre BPM/energia/valência:
// Em 27/11/2024 o Spotify restringiu os endpoints "Audio Features",
// "Audio Analysis", "Recommendations" e "Related Artists" para qualquer
// app novo (só quem já tinha "extended quota mode" aprovado antes disso
// continua com acesso). Isso significa que HOJE não existe forma oficial
// de pedir BPM/energia/valência ao Spotify para um app novo como o
// Harmoody. Por isso este serviço só busca os metadados que a API ainda
// disponibiliza (nome, artista, álbum, capa, duração, popularidade) e o
// algoritmo de recomendação por BPM continua usando a base local do
// Harmoody, como já funcionava antes desta integração.

class SpotifyApiError extends Error {
  code: string;
  constructor(code: string, message: string) {
    super(message);
    this.code = code;
  }
}

async function spotifyFetch(path: string): Promise<any> {
  let accessToken: string;
  try {
    accessToken = await getValidAccessToken();
  } catch (err) {
    if (err instanceof SpotifyAuthError) {
      throw new SpotifyApiError(err.code, err.message);
    }
    throw err;
  }

  let response: Response;
  try {
    response = await fetch(`${API_BASE}${path}`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
  } catch {
    throw new SpotifyApiError(
      "network-error",
      "Não foi possível falar com o Spotify agora. Verifique sua internet."
    );
  }

  if (response.status === 401) {
    throw new SpotifyApiError(
      "unauthorized",
      "Sua conexão com o Spotify expirou. Conecte novamente."
    );
  }
  if (response.status === 403) {
    throw new SpotifyApiError(
      "forbidden",
      "O Spotify recusou essa solicitação para o seu app."
    );
  }
  if (response.status === 429) {
    throw new SpotifyApiError(
      "rate-limited",
      "Muitas solicitações ao Spotify agora. Tente novamente em instantes."
    );
  }
  if (!response.ok) {
    throw new SpotifyApiError(
      "spotify-error",
      "O Spotify está indisponível no momento. Tente novamente mais tarde."
    );
  }

  return response.json();
}

function mapTrack(raw: any): SpotifyTrack {
  return {
    id: raw.id,
    title: raw.name,
    artist: (raw.artists ?? []).map((a: any) => a.name).join(", "),
    album: raw.album?.name ?? "",
    cover: raw.album?.images?.[0]?.url ?? "",
    durationMs: raw.duration_ms ?? 0,
    popularity: raw.popularity ?? 0,
    previewUrl: raw.preview_url ?? null,
    spotifyUrl: raw.external_urls?.spotify ?? null,
  };
}

/**
 * Busca as músicas mais ouvidas do usuário conectado (curto prazo).
 * Requer o escopo "user-top-read".
 */
export async function fetchUserTopTracks(limit = 12): Promise<SpotifyTrack[]> {
  const data = await spotifyFetch(
    `/me/top/tracks?limit=${limit}&time_range=medium_term`
  );
  const items = data.items ?? [];
  if (items.length === 0) {
    throw new SpotifyApiError(
      "no-tracks",
      "Ainda não encontramos músicas suficientes no seu histórico do Spotify."
    );
  }
  return items.map(mapTrack);
}

/**
 * Busca músicas salvas na biblioteca do usuário.
 * Requer o escopo "user-library-read".
 */
export async function fetchUserSavedTracks(limit = 12): Promise<SpotifyTrack[]> {
  const data = await spotifyFetch(`/me/tracks?limit=${limit}`);
  const items = data.items ?? [];
  if (items.length === 0) {
    throw new SpotifyApiError(
      "no-tracks",
      "Você ainda não tem músicas salvas na sua biblioteca do Spotify."
    );
  }
  return items.map((item: any) => mapTrack(item.track));
}

export { SpotifyApiError };
