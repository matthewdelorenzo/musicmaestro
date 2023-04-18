import React, { useEffect, useState } from "react";
import { authEndpoint, clientId, redirectUri, scopes } from "./config";
import hash from "./hash";
import axios from "axios";
import frontgraphic from "./frontgraphic.png";

const SERVER_URL = "http://127.0.0.1:5000"; // Replace with your own server URL

const genresData = {
  genres: [
    "acoustic",
    "afrobeat",
    "alt-rock",
    "alternative",
    "ambient",
    "anime",
    "black-metal",
    "bluegrass",
    "blues",
    "bossanova",
    "brazil",
    "breakbeat",
    "british",
    "cantopop",
    "chicago-house",
    "children",
    "chill",
    "classical",
    "club",
    "comedy",
    "country",
    "dance",
    "dancehall",
    "death-metal",
    "deep-house",
    "detroit-techno",
    "disco",
    "disney",
    "drum-and-bass",
    "dub",
    "dubstep",
    "edm",
    "electro",
    "electronic",
    "emo",
    "folk",
    "forro",
    "french",
    "funk",
    "garage",
    "german",
    "gospel",
    "goth",
    "grindcore",
    "groove",
    "grunge",
    "guitar",
    "happy",
    "hard-rock",
    "hardcore",
    "hardstyle",
    "heavy-metal",
    "hip-hop",
    "holidays",
    "honky-tonk",
    "house",
    "idm",
    "indian",
    "indie",
    "indie-pop",
    "industrial",
    "iranian",
    "j-dance",
    "j-idol",
    "j-pop",
    "j-rock",
    "jazz",
    "k-pop",
    "kids",
    "latin",
    "latino",
    "malay",
    "mandopop",
    "metal",
    "metal-misc",
    "metalcore",
    "minimal-techno",
    "movies",
    "mpb",
    "new-age",
    "new-release",
    "opera",
    "pagode",
    "party",
    "philippines-opm",
    "piano",
    "pop",
    "pop-film",
    "post-dubstep",
    "power-pop",
    "progressive-house",
    "psych-rock",
    "punk",
    "punk-rock",
    "r-n-b",
    "rainy-day",
    "reggae",
    "reggaeton",
    "road-trip",
    "rock",
    "rock-n-roll",
    "rockabilly",
    "romance",
    "sad",
    "salsa",
    "samba",
    "sertanejo",
    "show-tunes",
    "singer-songwriter",
    "ska",
    "sleep",
    "songwriter",
    "soul",
    "soundtracks",
    "spanish",
    "study",
    "summer",
    "swedish",
    "synth-pop",
    "tango",
    "techno",
    "trance",
    "trip-hop",
    "turkish",
    "work-out",
    "world-music",
  ],
};

function App() {
  const [playlists, setPlaylists] = useState([]);
  const [playlist, setPlaylist] = useState();
  const [playlistAttributes, setPlaylistAttributes] = useState(null);
  const [genre, setGenre] = useState("");
  const [token, setToken] = useState("");
  const [newPlaylist, setNewPlaylist] = useState();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const tokenParam = params.get("access_token");
    console.log(tokenParam);
    if (tokenParam) {
      localStorage.setItem("token", tokenParam);
      setToken(tokenParam);
      getUserPlaylists(tokenParam);
    } else {
      localStorage.removeItem("token");
      setPlaylists([]);
    }
    window.location.hash = "";
  }, []);

  const handleLogin = () => {
    const authUrl = `${authEndpoint}?client_id=${clientId}&redirect_uri=${redirectUri}&scope=${scopes.join(
      "%20"
    )}&response_type=token&show_dialog=true`;
    window.location.href = authUrl;
  };

  const getUserPlaylists = (token) => {
    axios({
      url: "https://api.spotify.com/v1/me/playlists",
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      params: {
        limit: 20,
        offset: 0,
        fields: "items(id,name,images)",
      },
    })
      .then((response) => {
        const playlists = response.data.items;
        const promises = playlists.map((playlist) => {
          return axios({
            url: `https://api.spotify.com/v1/playlists/${playlist.id}/tracks`,
            method: "GET",
            headers: {
              Authorization: `Bearer ${token}`,
            },
          })
            .then((response) => {
              return response.data.items;
            })
            .catch((error) => {
              console.log(error);
              return [];
            });
        });
        Promise.all(promises).then((tracks) => {
          const playlistsWithTracks = playlists.map((playlist, index) => {
            return {
              ...playlist,
              tracks: tracks[index],
            };
          });
          setPlaylists(playlistsWithTracks);
        });
      })
      .catch((error) => {
        console.log(error);
      });
  };

  const getPlaylistAttributes = async (tracks) => {
    const trackIds = tracks.map((track) => track.track.id).join(",");
    try {
      const response = await axios({
        url: `https://api.spotify.com/v1/audio-features?ids=${trackIds}`,
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const audioFeatures = response.data.audio_features;

      let sumAttributes = audioFeatures.reduce(
        (acc, audioFeature) => {
          acc.acousticness += audioFeature.acousticness;
          acc.danceability += audioFeature.danceability;
          acc.energy += audioFeature.energy;
          acc.instrumentalness += audioFeature.instrumentalness;
          acc.liveness += audioFeature.liveness;
          acc.valence += audioFeature.valence;
          return acc;
        },
        {
          acousticness: 0,
          danceability: 0,
          energy: 0,
          instrumentalness: 0,
          liveness: 0,
          valence: 0,
        }
      );

      let avgAttributes = {
        acousticness: sumAttributes.acousticness / audioFeatures.length,
        danceability: sumAttributes.danceability / audioFeatures.length,
        energy: sumAttributes.energy / audioFeatures.length,
        instrumentalness: sumAttributes.instrumentalness / audioFeatures.length,
        liveness: sumAttributes.liveness / audioFeatures.length,
        valence: sumAttributes.valence / audioFeatures.length,
      };

      setPlaylistAttributes(avgAttributes);
    } catch (error) {
      console.log(error);
    }
  };

  const handleGenreChange = (event) => {
    setGenre(event.target.value);
  };

  const genreOptions = genresData.genres.map((genre) => (
    <option key={genre} value={genre}>
      {genre}
    </option>
  ));

  const fetchRecommendations = async () => {
    if (!genre || !playlistAttributes) {
      return;
    }
  
    try {
      const response = await axios({
        url: "https://api.spotify.com/v1/recommendations",
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        params: {
          seed_genres: genre,
          target_acousticness: playlistAttributes.acousticness,
          target_danceability: playlistAttributes.danceability,
          target_energy: playlistAttributes.energy,
          target_instrumentalness: playlistAttributes.instrumentalness,
          target_liveness: playlistAttributes.liveness,
          target_valence: playlistAttributes.valence,
          limit: 10,
          max_popularity: 40,
        },
      });
  
      setNewPlaylist(response.data.tracks);
    } catch (error) {
      console.log(error);
    }
  };
  

  return (
    <div>
      <div className="flex w-full p-7 fixed">
        <h1 className="font-titles font-extrabold tracking-tighter text-2xl">
          Maestro
        </h1>
      </div>
      <div className="flex w-screen min-h-screen items-center justify-center">
        {token && !playlist && !newPlaylist ? (
          <div className="flex flex-col items-left justify-center gap-5">
            <h1 className="font-titles font-extrabold tracking-tighter text-xl md:text-3xl">
              Select a playlist.
            </h1>
            <div className="grid grid-cols-4 gap-4">
              {playlists &&
                playlists.map((playlist) => (
                  <div
                    key={playlist.id}
                    className="flex flex-col items-center justify-center gap-2"
                    onClick={() => {
                      setPlaylist(playlist);
                      getPlaylistAttributes(playlist.tracks);
                    }}
                  >
                    <img
                      src={playlist.images[0].url}
                      alt={playlist.name}
                      className="hover:grayscale hover:contrast-100 duration-300 h-[200px] w-[200px]"
                    />
                    <p className="font-titles font-extrabold tracking-tighter">
                      {playlist.name}
                    </p>
                  </div>
                ))}
            </div>
          </div>
        ) : token && playlist && !newPlaylist ? (
          <div className="flex flex-col gap-6">
            <h1 className="font-titles font-extrabold tracking-tighter text-xl md:text-3xl">
              {playlist.name}
            </h1>
            <div className="flex gap-10">
              <div className="flex flex-col items-center justify-center gap-2">
                <img
                  src={playlist.images[0].url}
                  alt={playlist.name}
                  className="hover:grayscale hover:contrast-100 duration-300 h-[200px] w-[200px]"
                />
              </div>
              <div className="flex flex-col gap-4 w-[300px] justify-center">
                {playlistAttributes && (
                  <p className="font-body font-regular text-sm md:text-lg">
                    This playlist is{" "}
                    <span className="font-body font-bold">
                      {(playlistAttributes.acousticness * 100).toFixed(2)}%
                      acoustic
                    </span>
                    ,{" "}
                    <span className="font-body font-bold">
                      {(playlistAttributes.danceability * 100).toFixed(2)}%
                      danceable, {(playlistAttributes.energy * 100).toFixed(2)}%
                      energetic
                    </span>
                    ,{" "}
                    <span className="font-body font-bold">
                      {(playlistAttributes.instrumentalness * 100).toFixed(2)}%
                      instrumental
                    </span>
                    ,{" "}
                    <span className="font-body font-bold">
                      {(playlistAttributes.liveness * 100).toFixed(2)}% lively
                    </span>
                    , and{" "}
                    <span className="font-body font-bold">
                      {(playlistAttributes.valence * 100).toFixed(2)}% positive
                    </span>
                    .
                  </p>
                )}
                <select
                  id="genres"
                  onChange={handleGenreChange}
                  value={genre}
                  className="bg-green hover:bg-dark-green duration-300 text-white font-titles font-bold text-xs md:text-sm uppercase py-2 px-4 rounded-full"
                >
                  <option selected value="">
                    Choose a genre
                  </option>
                  {genreOptions}
                </select>
              </div>
            </div>
            <button
              onClick={fetchRecommendations}
              className="bg-green hover:bg-dark-green duration-300 text-white font-titles font-bold text-xs md:text-sm uppercase py-2 px-4 rounded-full"
            >
              Send
            </button>
            <button
              onClick={() => setPlaylist(null)}
              className="bg-green hover:bg-dark-green duration-300 text-white font-titles font-bold text-xs md:text-sm uppercase py-2 px-4 rounded-full"
            >
              BACK
            </button>
          </div>
        ) : null}
        {newPlaylist ?     
        <div>
          <h2 className="font-titles font-extrabold tracking-tighter text-xl md:text-2xl">Recommended Tracks</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {newPlaylist.map((track) => (
              <div key={track.id} className="flex items-center gap-4">
                <img src={track.album.images[0].url} alt={track.name} className="w-20 h-20" />
                <div>
                  <p className="font-titles font-bold text-sm">{track.name}</p>
                  <p className="font-body font-regular text-xs">{track.artists[0].name}</p>
                </div>
              </div>
            ))}
            <button
              onClick={() => setNewPlaylist(null)}
              className="bg-green hover:bg-dark-green duration-300 text-white font-titles font-bold text-xs md:text-sm uppercase py-2 px-4 rounded-full"
            >
              BACK
            </button>
          </div>
        </div> : null}
        {!token ? (
          <div className="flex flex-col md:flex-row px-24 gap-3 items-center justify-between">
            <div className="flex flex-col w-[50%] gap-3">
              <h1 className="font-titles font-extrabold tracking-tighter text-2xl md:text-5xl">
                A new way to get into a genre.
              </h1>
              <p className="font-body font-regular text-sm md:text-lg">
                Introducing Maestro, the music platform that makes it effortless
                to discover new music genres. With Maestro, you can easily
                upload your playlist and receive tailored recommendations based
                on your preferred genre. Say goodbye to endless searching, and
                hello to an immersive musical experience with Maestro.
              </p>
              <button
                onClick={handleLogin}
                className="bg-green hover:bg-dark-green duration-300 text-white font-titles font-bold text-xs md:text-sm uppercase py-2 px-4 rounded-full lg:w-1/3"
              >
                Connect with Spotify
              </button>
            </div>
            <img src={frontgraphic} alt="" className="max-w-lg" />
          </div>
        ) : null}
      </div>
    </div>
  );
}

export default App;
