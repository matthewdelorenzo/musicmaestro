import React, { useEffect, useState } from 'react';
import axios from 'axios';

const SERVER_URL = 'http://127.0.0.1:5000';

function Playlists({ token }) {
  const [playlists, setPlaylists] = useState([]);

  useEffect(() => {
    getUserPlaylists(token);
  }, [token]);

  const getUserPlaylists = (token) => {
    axios({
      url: 'https://api.spotify.com/v1/me/playlists',
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
      },
      params: {
        limit: 20,
        offset: 0,
        fields: 'items(id,name,images)'
      }
    })
    .then(response => {
      const playlists = response.data.items;
      const promises = playlists.map((playlist) => {
        return axios({
          url: `https://api.spotify.com/v1/playlists/${playlist.id}/tracks`,
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        })
        .then(response => {
          return response.data.items;
        })
        .catch(error => {
          console.log(error);
          return [];
        });
      });
      Promise.all(promises)
        .then((tracks) => {
          const playlistsWithTracks = playlists.map((playlist, index) => {
            return {
              ...playlist,
              tracks: tracks[index]
            };
          });
          setPlaylists(playlistsWithTracks);
        });
    })
    .catch(error => {
      console.log(error);
    });
  };

  return (
    <>
      <p>You are logged in!</p>
      <button onClick={() => getUserPlaylists(token)}>Get Playlist</button>
      <ul>
        {playlists.map(playlist => (
          <li key={playlist.id}>
            <img src={playlist.images[0].url} alt={playlist.name} />
            <p>{playlist.name}</p>
            <ul>
              {playlist.tracks.map(track => (
                <li key={track.track.id}>{track.track.name}</li>
              ))}
            </ul>
          </li>
        ))}
      </ul>
    </>
  );
}

export default Playlists;
