const API_KEY = 'a17f1d21ede1d36b12663db5807fbb9b';
const BASE_URL = 'https://api.themoviedb.org/3';

export async function getFilmById(title) {
  try {
    const res = await fetch(
      `${BASE_URL}/search/movie?api_key=${API_KEY}&query=${encodeURIComponent(title)}&language=fr-FR`
    );
    const data = await res.json();
    return data.results[0] || null; // Retourne le premier résultat trouvé
  } catch (error) {
    console.error("Erreur API:", error);
    return null;
  }
}

export function checkAnswer(valeurAttendue, saisieJoueur) {
  // Nettoyage pour comparer sans casse ni espaces inutiles
  return valeurAttendue.toLowerCase().trim() === saisieJoueur.toLowerCase().trim();
}