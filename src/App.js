import React, { useEffect, useState } from "react";
import { authEndpoint, clientId, redirectUri, scopes } from "./config";
import hash from "./hash";
import axios from "axios";
import frontgraphic from "./frontgraphic.png";

const SERVER_URL = "http://127.0.0.1:5000"; // Replace with your own server URL

function App() {
  const [playlists, setPlaylists] = useState([]);
  const [playlist, setPlaylist] = useState();
  console.log(playlists);
  const [token, setToken] = useState("");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const tokenParam = params.get("access_token");
    console.log(tokenParam);
    if (tokenParam) {
      localStorage.setItem("token", tokenParam);
      setToken(tokenParam);
      getUserPlaylists(token);
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

  return (
    <div>
      <div className="flex w-full p-7 fixed">
        <h1 className="font-titles font-extrabold tracking-tighter text-2xl">
          Maestro
        </h1>
      </div>
      <div className="flex w-screen min-h-screen items-center justify-center">
        {token && !playlist ? (
          <div>
            <p>You are logged in!</p>
            <button
              onClick={() => getUserPlaylists(token)}
              className="bg-green hover:bg-dark-green duration-300 text-white font-titles font-bold text-xs md:text-sm uppercase py-2 px-4 rounded-full"
            >
              Get Playlist
            </button>
            <ul className="flex gap-4">
              {playlists &&
                playlists.map((playlist) => (
                  <li
                    key={playlist.id}
                    className="flex flex-col h-1/4 items-center justify-center gap-2"
                    onClick={() => setPlaylist(playlist)}
                  >
                    <img
                      src={playlist.images[0].url}
                      alt={playlist.name}
                      className="hover:h-[120px] hover:w-[120px] duration-300 h-[100px] w-[100px]"
                    />
                    <p>{playlist.name}</p>
                  </li>
                ))}
            </ul>
          </div>
        ) : token && playlist ? (
          <div>
            Your Playlist:
            <div>
              <img
                src={playlist.images[0].url}
                alt={playlist.name}
                className="hover:h-[120px] hover:w-[120px] duration-300 h-[100px] w-[100px]"
              />
              <p>{playlist.name}</p>
              <ul className="flex flex-col gap-4">
              {playlist.tracks.map((track) => (
                <li key={track.track.name} className="flex justify-left items-center gap-2">
                  <img
                    src={track.track.album.images[2].url}
                    alt={playlist.name}
                    className="h-[60px] w-[60px]"
                  />
                  {track.track.name}
                </li>
              ))}
              </ul>
            </div>
            <button
              onClick={() => setPlaylist(null)}
              className="bg-green hover:bg-dark-green duration-300 text-white font-titles font-bold text-xs md:text-sm uppercase py-2 px-4 rounded-full"
            >
              BACK
            </button>
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
