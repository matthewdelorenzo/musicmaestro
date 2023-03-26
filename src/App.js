import React, { useEffect, useState } from 'react';
import axios from 'axios';
import frontgraphic from "./frontgraphic.png"

const SERVER_URL = 'http://127.0.0.1:5000'; // Replace with your own server URL

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [playlist, setPlaylist] = useState([]);

  useEffect(() => {
    const token = localStorage.getItem('spotifyToken');
    if (token) {
      setIsLoggedIn(true);
      getPlaylist(token);
    } else {
      setIsLoggedIn(false);
      setPlaylist([]);
    }
  }, []);

  const handleLogin = () => {
    axios({
      method: 'POST',
      url: `${SERVER_URL}/login`,
      withCredentials: true,
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
    })
      .then((response) => {
        window.location = response.request.responseURL;
      })
      .catch((error) => {
        console.log(error);
      });
  };

  const getPlaylist = (token) => {
    axios({
      method: 'GET',
      url: `${SERVER_URL}/getPlaylist`,
      withCredentials: true,
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        'Access-Control-Allow-Origin': 'http://localhost:3000',
      },
      params: {
        limit: 5,
        offset: 0
      }
    })
      .then((response) => {
        setPlaylist(response.data);
      })
      .catch((error) => {
        console.log(error);
      });
  };

  return (
    <div >
      <div className='flex w-full p-7 fixed'>
        <h1 className='font-titles font-extrabold tracking-tighter text-2xl'>Maestro</h1>
      </div>
      <div className='flex w-screen min-h-screen items-center justify-center'>
        {isLoggedIn ? (
          <div>
            <p>You are logged in!</p>
            <button onClick={() => getPlaylist(localStorage.getItem('spotifyToken'))}>Get Playlist</button>
            <ul>
              {playlist.map((track) => (
                <li key={track.track.id}>{track.track.name} by {track.track.artists[0].name}</li>
              ))}
            </ul>
          </div>
        ) : (
          <div className='flex flex-col md:flex-row px-24 gap-3 items-center justify-between'>
            <div className='flex flex-col w-[50%] gap-3'>
              <h1 className='font-titles font-extrabold tracking-tighter text-2xl md:text-5xl'>A new way to get into a genre.</h1>
              <p className='font-body font-regular text-sm md:text-lg'>Introducing Maestro, the music platform that makes it effortless to discover new music genres. With Maestro, you can easily upload your playlist and receive tailored recommendations based on your preferred genre. Say goodbye to endless searching, and hello to an immersive musical experience with Maestro.</p>
              <button onClick={handleLogin} className="bg-green hover:bg-dark-green duration-300 text-white font-titles font-bold text-xs md:text-sm uppercase py-2 px-4 rounded-full lg:w-1/3">Connect with Spotify</button>
            </div>
            <img src={frontgraphic} alt="" className='max-w-lg'/>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
