const API_KEY = import.meta.env.VITE_TMDB_API_KEY;
const BASE_URL = 'https://api.themoviedb.org/3';
const IMG_URL  = 'https://image.tmdb.org/t/p/w500';

export async function getFilmById(title) {
  const res = await fetch(
    `${BASE_URL}/search/movie?api_key=${API_KEY}&query=${encodeURIComponent(title)}&language=fr-FR`
  );
  const data = await res.json();
  const film = data.results[0];
  if (!film) return null;
  return {
    title:       film.title,
    description: film.overview,
    poster:      IMG_URL + film.poster_path,
    year:        film.release_date?.split('-')[0],
    note:        film.vote_average,
  };
}

export function checkAnswer(titleAttendu, inputDuJoueur) {
  return titleAttendu.toLowerCase().trim() === inputDuJoueur.toLowerCase().trim();
}