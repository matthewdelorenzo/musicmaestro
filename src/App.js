import React, { useEffect, useState } from "react";
import { authEndpoint, clientId, redirectUri, scopes } from "./config";
import axios from "axios";
import frontgraphic from "./frontgraphic.png";
import NoArtistImage from "./NoArtistImage.jpeg";
import NoPlaylistImage from "./NoPlaylistImage.png";

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
  const [exported, setExported] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const tokenParam = params.get("access_token");
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
          limit: 30,
          max_popularity: 20,
        },
      });

      const tracks = response.data.tracks;
      const artists = await Promise.all(
        tracks.map((track) =>
          axios.get(
            `https://api.spotify.com/v1/artists/${track.artists[0].id}`,
            {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            }
          )
        )
      );

      const updatedTracks = tracks.map((track, index) => {
        const artistImage = artists[index].data.images[0]?.url;
        return {
          ...track,
          artistImage: artistImage || null,
        };
      });

      setNewPlaylist(updatedTracks);
    } catch (error) {
      console.log(error);
    }
  };

  const createPlaylist = async () => {
    try {
      const userId = await getUserId();
      const playlistId = await createNewPlaylist(userId);
      await addTracksToPlaylist(playlistId);
      setExported(true);
    } catch (error) {
      console.log(error);
    }
  };

  const getUserId = async () => {
    try {
      const response = await axios({
        url: "https://api.spotify.com/v1/me",
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      return response.data.id;
    } catch (error) {
      console.log(error);
      return null;
    }
  };

  const createNewPlaylist = async (userId) => {
    try {
      const response = await axios({
        url: `https://api.spotify.com/v1/users/${userId}/playlists`,
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        data: {
          name: `${playlist.name} - ${
            genre.charAt(0).toUpperCase() + genre.slice(1)
          } Remix`,
          description: `Created by Maestro, tailored to your music taste. Enjoy your new ${genre} playlist!`,
        },
      });
      return response.data.id;
    } catch (error) {
      console.log(error);
      return null;
    }
  };

  const addTracksToPlaylist = async (playlistId) => {
    try {
      const uris = newPlaylist.map((track) => track.uri);
      await axios({
        url: `https://api.spotify.com/v1/playlists/${playlistId}/tracks`,
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        data: {
          uris: uris,
        },
      });
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
      <div className="flex w-screen min-h-screen justify-center pt-[89px] pb-[59px] px-4">
        {token && !playlist && !newPlaylist ? (
          <div className="flex flex-col items-left justify-center gap-5">
            <h1 className="font-titles font-extrabold tracking-tighter text-3xl md:text-4xl">
              Select a playlist.
            </h1>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
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
                      src={playlist.images[0]?.url || NoPlaylistImage}
                      alt={playlist.name}
                      className="hover:grayscale hover:contrast-100 duration-300 object-contain h-48 w-48"
                    />
                    <p className="font-titles font-extrabold tracking-tighter">
                      {playlist.name}
                    </p>
                  </div>
                ))}
            </div>
          </div>
        ) : token && playlist && !newPlaylist ? (
          <div className="flex flex-col w-full px-4 justify-center items-center lg:items-start md:w-2/5 gap-6">
            <h1 className="font-titles font-extrabold tracking-tighter text-3xl md:text-4xl">
              Your Selected Playlist
            </h1>
            <div className="flex flex-col lg:flex-row gap-10 justify-between">
              <div className="flex flex-col items-center justify-between">
                <img
                  src={playlist.images[0]?.url || NoPlaylistImage}
                  alt={playlist.name}
                  className="object-cover h-48 w-48"
                />
                <h3 className="font-titles font-extrabold tracking-tighter mt-4 text-lg">
                  {playlist.name}
                </h3>
              </div>
              <div className="flex flex-col gap-4 w-full lg:w-1/2 justify-center">
                {playlistAttributes && (
                  <div className="flex flex-col gap-2">
                    <p className="font-body font-regular text-sm md:text-lg">
                      This playlist is{" "}
                      <span className="font-body font-bold">
                        {(playlistAttributes.acousticness * 100).toFixed(2)}%
                        acoustic
                      </span>
                      ,{" "}
                      <span className="font-body font-bold">
                        {(playlistAttributes.danceability * 100).toFixed(2)}%
                        danceable,{" "}
                        {(playlistAttributes.energy * 100).toFixed(2)}%
                        energetic
                      </span>
                      ,{" "}
                      <span className="font-body font-bold">
                        {(playlistAttributes.instrumentalness * 100).toFixed(2)}
                        % instrumental
                      </span>
                      ,{" "}
                      <span className="font-body font-bold">
                        {(playlistAttributes.liveness * 100).toFixed(2)}% lively
                      </span>
                      , and{" "}
                      <span className="font-body font-bold">
                        {(playlistAttributes.valence * 100).toFixed(2)}%
                        positive
                      </span>
                      .
                    </p>
                    <p className="font-body font-regular text-sm md:text-lg">
                      Now, choose a genre.
                    </p>
                  </div>
                )}
                <select
                  id="genres"
                  onChange={handleGenreChange}
                  value={genre}
                  className="bg-green hover:bg-dark-green duration-300 text-white font-titles font-bold text-xs md:text-sm uppercase py-2 px-4 rounded-full w-full mt-4"
                >
                  <option selected value="">
                    Choose a genre
                  </option>
                  {genreOptions}
                </select>
              </div>
            </div>
            <div className="flex w-full gap-10 mt-6">
              <button
                onClick={() => {
                  setPlaylist(null);
                  setGenre("");
                }}
                className="w-full bg-green hover:bg-dark-green duration-300 text-white font-titles font-bold text-xs md:text-sm uppercase py-2 px-4 rounded-full"
              >
                BACK
              </button>
              <button
                onClick={fetchRecommendations}
                className="w-full bg-green hover:bg-dark-green duration-300 text-white font-titles font-bold text-xs md:text-sm uppercase py-2 px-4 rounded-full"
              >
                Send
              </button>
            </div>
          </div>
        ) : null}
        {newPlaylist ? (
          <div className="flex flex-col w-full px-4 gap-6 justify-center">
            <div className="flex flex-col w-full gap-2 justify-center items-center">
              <h1 className="font-titles font-extrabold tracking-tighter text-3xl md:text-4xl">
                Your new playlist is here.
              </h1>
              <p className="font-body font-regular text-xs md:text-base">
                Enjoy your new adventure into the world of {genre} music.
              </p>
            </div>
            <div className="flex flex-wrap justify-center gap-8">
              <div className="flex flex-col gap-3 justify-center items-center">
                <div className="grid grid-cols-2 gap-4">
                  {newPlaylist.slice(0, 4).map((track) => (
                    <div key={track.id} className="flex items-center">
                      <img
                        src={track.album.images[0].url}
                        alt={track.name}
                        className="object-cover w-36 h-36 md:w-28 md:h-28"
                      />
                    </div>
                  ))}
                </div>
                <div className="flex w-full justify-center mt-4">
                  <h1 className="font-titles font-extrabold tracking-tighter text-lg">
                    {`${playlist.name} - ${
                      genre.charAt(0).toUpperCase() + genre.slice(1)
                    } Remix`}
                  </h1>
                </div>
                <div className="flex w-full justify-center mt-4">
                  <button
                    onClick={createPlaylist}
                    className="bg-green hover:bg-dark-green duration-300 text-white font-titles font-bold text-xs md:text-sm uppercase py-2 px-4 rounded-full"
                  >
                    Export to Spotify
                  </button>
                </div>
                {exported ? (
                  <div className="flex w-full justify-center mt-4">
                    <p className="font-body font-regular text-sm">
                      Playlist has been exported!
                    </p>
                  </div>
                ) : null}
              </div>
              <div className="flex flex-col gap-3 w-full md:w-2/5">
                <h1 className="font-titles font-extrabold tracking-tighter text-2xl">
                  How we decided
                </h1>
                <p className="font-body font-sm">
                  Our app analyzes your playlist and their attributes, such as 
                  acousticness, danceability, and
                  more. Based on these insights and your chosen genre, we curate
                  a personalized playlist to match your
                  unique music taste.
                </p>
                <h1 className="font-titles font-extrabold tracking-tighter text-2xl">
                  What to expect
                </h1>
                <p className="font-body font-sm">
                  You'll find 30 new tracks in the {genre} genre, all tailored to
                  the specificities of your playlist. All you have to do now is enjoy.
                </p>
                <h1 className="font-titles font-extrabold tracking-tighter text-2xl">
                  Featuring
                </h1>
                <div className="grid grid-cols-4 gap-4">
                  {newPlaylist.slice(0, 4).map((track) => (
                    <div
                      key={track.id}
                      className="flex flex-col items-center gap-4"
                    >
                      <img
                        src={
                          track.artistImage ? track.artistImage : NoArtistImage
                        }
                        alt={track.name}
                        className="object-cover w-28 h-28 md:w-20 md:h-20 rounded-full"
                      />
                      <h1 className="font-titles font-extrabold tracking-tighter text-sm">
                        {track.artists[0].name}
                      </h1>
                    </div>
                  ))}
                </div>
                <div className="flex w-full justify-center mt-6">
                  <button
                    onClick={() => {
                      setPlaylist(null);
                      setNewPlaylist(null);
                      setGenre("");
                      setExported(false);
                    }}
                    className="w-1/5 bg-green hover:bg-dark-green duration-300 text-white font-titles font-bold text-xs md:text-sm uppercase py-2 px-4 rounded-full"
                  >
                    BACK
                  </button>
                </div>
              </div>
            </div>
          </div>
        ) : null}
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
                className="bg-green hover:bg-dark-green duration-300 text-white font-titles font-bold text-xs md:text-sm uppercase py-2 px-4 rounded-full lg:w-1/2"
              >
                Connect with Spotify
              </button>
            </div>
            <img src={frontgraphic} alt="" className="max-w-md" />
          </div>
        ) : null}
      </div>
    </div>
  );
}

export default App;
