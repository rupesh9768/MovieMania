import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  addFavoriteActor,
  checkFavoriteActor,
  removeFavoriteActor
} from '../api/userService';

const API_KEY = import.meta.env.VITE_TMDB_API_KEY;
const TMDB_BASE = 'https://api.themoviedb.org/3';
const IMG_BASE = 'https://image.tmdb.org/t/p/w500';
const BACKDROP_BASE = 'https://image.tmdb.org/t/p/original';

const PersonDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  const [person, setPerson] = useState(null);
  const [combinedCredits, setCombinedCredits] = useState({ cast: [], crew: [] });
  const [loading, setLoading] = useState(true);
  const [favoriteLoading, setFavoriteLoading] = useState(false);
  const [isFavoriteActor, setIsFavoriteActor] = useState(false);
  const [favoriteMeta, setFavoriteMeta] = useState({ count: 0, max: 10 });

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [id]);

  useEffect(() => {
    const loadFavoriteStatus = async () => {
      if (!isAuthenticated || !id) {
        setIsFavoriteActor(false);
        setFavoriteMeta({ count: 0, max: 10 });
        return;
      }

      try {
        const status = await checkFavoriteActor(id);
        setIsFavoriteActor(Boolean(status.inFavoriteActors));
        setFavoriteMeta({ count: status.count || 0, max: status.max || 10 });
      } catch (error) {
        console.error('Failed to check actor favorite status:', error);
      }
    };

    loadFavoriteStatus();
  }, [id, isAuthenticated]);

  useEffect(() => {
    const fetchPersonData = async () => {
      if (!id) return;

      setLoading(true);
      try {
        const [personRes, creditsRes] = await Promise.all([
          fetch(`${TMDB_BASE}/person/${id}?api_key=${API_KEY}`),
          fetch(`${TMDB_BASE}/person/${id}/combined_credits?api_key=${API_KEY}`)
        ]);

        if (!personRes.ok) throw new Error('Person not found');

        const personData = await personRes.json();
        setPerson(personData);

        if (creditsRes.ok) {
          const creditsData = await creditsRes.json();
          setCombinedCredits({
            cast: Array.isArray(creditsData.cast) ? creditsData.cast : [],
            crew: Array.isArray(creditsData.crew) ? creditsData.crew : []
          });
        } else {
          setCombinedCredits({ cast: [], crew: [] });
        }
      } catch (error) {
        console.error('Failed to fetch person details:', error);
        setPerson(null);
      } finally {
        setLoading(false);
      }
    };

    fetchPersonData();
  }, [id]);

  const getCreditDate = (credit) => {
    return credit.release_date || credit.first_air_date || '0000-00-00';
  };

  const topCastCredits = useMemo(() => {
    return [...combinedCredits.cast]
      .filter((credit) => (credit.media_type === 'movie' || credit.media_type === 'tv') && (credit.poster_path || credit.backdrop_path))
      .sort((a, b) => {
        const dateA = getCreditDate(a);
        const dateB = getCreditDate(b);
        return dateA < dateB ? 1 : -1;
      })
      .slice(0, 20);
  }, [combinedCredits]);

  const topCrewCredits = useMemo(() => {
    return [...combinedCredits.crew]
      .filter((credit) => (credit.media_type === 'movie' || credit.media_type === 'tv') && (credit.poster_path || credit.backdrop_path))
      .sort((a, b) => {
        const dateA = getCreditDate(a);
        const dateB = getCreditDate(b);
        return dateA < dateB ? 1 : -1;
      })
      .slice(0, 20);
  }, [combinedCredits]);

  const formatDate = (dateValue) => {
    if (!dateValue) return 'N/A';
    const dt = new Date(dateValue);
    if (Number.isNaN(dt.getTime())) return 'N/A';
    return dt.toLocaleDateString();
  };

  const getGenderLabel = (gender) => {
    if (gender === 1) return 'Female';
    if (gender === 2) return 'Male';
    if (gender === 3) return 'Non-binary';
    return 'Not specified';
  };

  const openCredit = (credit) => {
    const mediaType = credit.media_type === 'tv' ? 'tv' : 'movie';
    navigate(`/details/${mediaType}/${credit.id}`);
  };

  const handleFavoriteActorToggle = async () => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    if (!person || !id) return;

    setFavoriteLoading(true);
    try {
      if (isFavoriteActor) {
        const res = await removeFavoriteActor(id);
        setIsFavoriteActor(false);
        setFavoriteMeta({ count: res.count || 0, max: res.max || 10 });
      } else {
        if ((favoriteMeta.count || 0) >= (favoriteMeta.max || 10)) {
          alert('You can only add up to 10 favorite actors. Remove one to add another.');
          return;
        }
        const res = await addFavoriteActor({
          personId: id,
          name: person.name,
          profilePath: person.profile_path,
          knownForDepartment: person.known_for_department
        });
        setIsFavoriteActor(true);
        setFavoriteMeta({ count: res.count || 0, max: res.max || 10 });
      }
    } catch (error) {
      console.error('Failed to update favorite actor:', error);
      alert(error.response?.data?.message || 'Failed to update favorite actor');
    } finally {
      setFavoriteLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-dark-bg flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!person) {
    return (
      <div className="min-h-screen bg-dark-bg text-white flex flex-col items-center justify-center">
        <h1 className="text-3xl font-bold mb-4">Person Not Found</h1>
        <button onClick={() => navigate(-1)} className="text-cyan-400 hover:underline">
          Go Back
        </button>
      </div>
    );
  }

  const profileUrl = person.profile_path ? `${IMG_BASE}${person.profile_path}` : null;
  const heroUrl = person.profile_path ? `${BACKDROP_BASE}${person.profile_path}` : null;

  return (
    <div className="min-h-screen bg-dark-bg text-white">
      <div className="sticky top-16 z-40 bg-[#0a0f1a]/95 backdrop-blur-sm border-b border-slate-800/30">
        <div className="max-w-6xl mx-auto px-6 py-2.5">
          <button onClick={() => navigate(-1)} className="text-slate-400 hover:text-white text-sm transition-colors">
            Back
          </button>
        </div>
      </div>

      <section className="relative h-[42vh] min-h-80 overflow-hidden">
        {heroUrl ? (
          <div className="absolute inset-0 bg-cover bg-center scale-110" style={{ backgroundImage: `url(${heroUrl})` }} />
        ) : (
          <div className="absolute inset-0 bg-linear-to-br from-slate-900 to-slate-800" />
        )}
        <div className="absolute inset-0 bg-linear-to-r from-dark-bg via-dark-bg/80 to-dark-bg/55" />
        <div className="absolute inset-0 bg-linear-to-t from-dark-bg via-transparent to-dark-bg/30" />

        <div className="relative h-full max-w-6xl mx-auto px-6 flex items-end pb-10">
          <div className="flex gap-5 items-end">
            {profileUrl ? (
              <img src={profileUrl} alt={person.name} className="w-28 md:w-36 rounded-xl border border-slate-700/40 shadow-2xl" />
            ) : (
              <div className="w-28 md:w-36 aspect-2/3 rounded-xl border border-slate-700/40 bg-slate-800 flex items-center justify-center text-slate-500 text-sm">N/A</div>
            )}

            <div>
              <p className="text-xs uppercase tracking-widest text-cyan-400 mb-2">Person Profile</p>
              <h1 className="text-3xl md:text-5xl font-black leading-tight">{person.name}</h1>
              <p className="text-slate-400 mt-2">{person.known_for_department || 'Cast & Crew'}</p>
              <div className="mt-4 flex items-center gap-3">
                <button
                  type="button"
                  onClick={handleFavoriteActorToggle}
                  disabled={favoriteLoading || (!isFavoriteActor && (favoriteMeta.count || 0) >= (favoriteMeta.max || 10))}
                  className={`px-5 py-2 rounded-full text-sm font-semibold transition-all border cursor-pointer ${
                    isFavoriteActor
                      ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40 hover:bg-cyan-500/30'
                      : 'bg-slate-800 text-white border-slate-700 hover:bg-slate-700'
                  } ${favoriteLoading ? 'opacity-60 cursor-not-allowed' : ''}`}
                >
                  {favoriteLoading
                    ? 'Updating...'
                    : isFavoriteActor
                      ? 'Favorited Actor'
                      : 'Add Favorite Actor'}
                </button>
                <span className="text-xs text-slate-500">
                  {favoriteMeta.count}/{favoriteMeta.max} used
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="max-w-6xl mx-auto px-6 py-8 grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <section>
            <h2 className="text-lg font-bold mb-3 text-slate-200">Biography</h2>
            <p className="text-slate-400 leading-relaxed whitespace-pre-line">
              {person.biography || 'No biography available.'}
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold mb-4 text-slate-200">Acting Credits</h2>
            {topCastCredits.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {topCastCredits.map((credit) => {
                  const poster = credit.poster_path || credit.backdrop_path;
                  const title = credit.title || credit.name;
                  return (
                    <button
                      key={`cast-${credit.media_type}-${credit.id}-${credit.credit_id || title}`}
                      type="button"
                      onClick={() => openCredit(credit)}
                      className="text-left bg-slate-900/50 border border-slate-800/50 rounded-lg overflow-hidden hover:border-cyan-500/40 transition-all cursor-pointer"
                    >
                      <div className="aspect-2/3 bg-slate-800">
                        {poster ? (
                          <img src={`${IMG_BASE}${poster}`} alt={title} className="w-full h-full object-cover" />
                        ) : null}
                      </div>
                      <div className="p-2.5">
                        <p className="text-sm font-semibold truncate">{title}</p>
                        <p className="text-xs text-slate-500 truncate">{credit.character || 'Actor'}</p>
                      </div>
                    </button>
                  );
                })}
              </div>
            ) : (
              <p className="text-slate-500 text-sm">No acting credits available.</p>
            )}
          </section>

          <section>
            <h2 className="text-lg font-bold mb-4 text-slate-200">Crew Credits</h2>
            {topCrewCredits.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {topCrewCredits.map((credit) => {
                  const poster = credit.poster_path || credit.backdrop_path;
                  const title = credit.title || credit.name;
                  return (
                    <button
                      key={`crew-${credit.media_type}-${credit.id}-${credit.credit_id || title}`}
                      type="button"
                      onClick={() => openCredit(credit)}
                      className="text-left bg-slate-900/50 border border-slate-800/50 rounded-lg overflow-hidden hover:border-cyan-500/40 transition-all cursor-pointer"
                    >
                      <div className="aspect-2/3 bg-slate-800">
                        {poster ? (
                          <img src={`${IMG_BASE}${poster}`} alt={title} className="w-full h-full object-cover" />
                        ) : null}
                      </div>
                      <div className="p-2.5">
                        <p className="text-sm font-semibold truncate">{title}</p>
                        <p className="text-xs text-slate-500 truncate">{credit.job || credit.department || 'Crew'}</p>
                      </div>
                    </button>
                  );
                })}
              </div>
            ) : (
              <p className="text-slate-500 text-sm">No crew credits available.</p>
            )}
          </section>
        </div>

        <div className="lg:col-span-1">
          <div className="bg-slate-900/60 border border-slate-800/50 rounded-xl p-5 sticky top-28 space-y-4">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Details</h3>

            <div>
              <p className="text-xs text-slate-600 mb-0.5">Known For</p>
              <p className="text-sm font-medium">{person.known_for_department || 'N/A'}</p>
            </div>

            <div>
              <p className="text-xs text-slate-600 mb-0.5">Birthday</p>
              <p className="text-sm font-medium">{formatDate(person.birthday)}</p>
            </div>

            <div>
              <p className="text-xs text-slate-600 mb-0.5">Place of Birth</p>
              <p className="text-sm font-medium">{person.place_of_birth || 'N/A'}</p>
            </div>

            <div>
              <p className="text-xs text-slate-600 mb-0.5">Gender</p>
              <p className="text-sm font-medium">{getGenderLabel(person.gender)}</p>
            </div>

            <div>
              <p className="text-xs text-slate-600 mb-0.5">Popularity</p>
              <p className="text-sm font-medium">{person.popularity ? person.popularity.toFixed(1) : 'N/A'}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PersonDetails;