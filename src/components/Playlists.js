import React from "react";

function Playlists({token}){

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
  );
};

export default Playlists;
