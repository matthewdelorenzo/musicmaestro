from flask import Flask, send_from_directory, render_template, session, url_for, redirect, request
from flask_restful import Api, Resource, reqparse
import spotipy
from spotipy.oauth2 import SpotifyOAuth
from flask_cors import CORS
from werkzeug.utils import secure_filename
from api.apihandler import apihandler
import os
import time

app = Flask(__name__, static_url_path='', static_folder='frontend/build')
CORS(app)
api = Api(app)
api.add_resource(apihandler, '/flask/hello')
app.secret_key = os.urandom(12)
app.config['SESSION_COOKIE_NAME'] = 'maestro_cookie'
TOKEN_INFO = "token_info"
global playlists
playlists = []
global songsNameId
songsNameId = []
global songQuals
songQuals = []

#Home Page - default route

#REACT MODLUDE!!!
#@app.route('/', defaults={'path':''})
#def home(path):
#    return send_from_directory(app.static_folder,'index.html')

@app.route('/')
def home():
    return render_template("index.html", playlist_html="")

@app.route('/index.html')
def home_page():
    return render_template("index.html")


####Everything below is currently not being ran with React addition!####

#Login procedure - called on button in HTML.
@app.route('/login', methods=['POST'])
def loginFunc():
    oauth_obj = create_spotify_oauth()
    auth_url = oauth_obj.get_authorize_url()
    return redirect(auth_url)

#Where Spotify app redirects after user logs in.
#Right now it immeadiately calls getPlaylist function (this will likely change).
@app.route('/redirect')
def redirectPage():
    oauth_obj = create_spotify_oauth()
    session.clear()
    code = request.args.get("code") 
    token = oauth_obj.get_access_token(code)
    session[TOKEN_INFO] = token
    return render_template("index.html", playlist_html="")
    #return redirect(url_for('getPlaylist', _external=True))

#Get playlist function - gets token, gets info, returns string.
@app.route('/getPlaylist', methods=['POST'])
def getPlaylist():
    try:
        token_info = get_token()
    except:
        print("User not logged in.")
        return redirect(url_for("login", _external=False))
    sp = spotipy.Spotify(auth=token_info['access_token'])
    #return str(sp.current_user_saved_tracks(limit=5, offset=0)['items'])
    playlists = str(sp.current_user_saved_tracks(limit=5, offset=0)['items'])
    return render_template("index.html", playlist_html = playlists)


#Gets playlists
@app.route('/getCoverInfo', methods=['POST'])
def getCoverInfo():
    try:
        token_info = get_token()
    except:
        print("User not logged in.")
        return redirect(url_for("login", _external=False))
    
    global playlists
    sp = spotipy.Spotify(auth=token_info['access_token'])
    playlists = sp.current_user_playlists(limit=50, offset=0)['items']
    list_names = []
    for i in range(len(playlists)):
        list_names.append(playlists[i]['name'])
    #playlists_str = str(playlists)
    return render_template("index.html", playlist_html = list_names)
    #return redirect(url_for("login", _external=False))

#gets song in playlist
@app.route('/getSongs', methods=['POST'])
def getSongs():
    try:
        token_info = get_token()
    except:
        print("User not logged in.")
        return redirect(url_for("login", _external=False))
    
    global songsNameId
    sp = spotipy.Spotify(auth=token_info['access_token'])
    name_playlist = request.form['getsongs']
    playlist_id = ""
    song_list = []

    for i in range(len(playlists)):
        if (playlists[i]['name'] == name_playlist):
            playlist_id = playlists[i]['id']
    playlist_info = sp.playlist(playlist_id)['tracks']['items']
    for i in range(len(playlist_info)):
        tempNameId = []
        tempNameId.append(playlist_info[i].get('track').get("name"))
        tempNameId.append(playlist_info[i].get('track').get("id"))
        songsNameId.append(tempNameId)
        #song_list.append(playlist_info[i].get('track').get("name"))
    return render_template("test_songs.html", song_data = songsNameId, songQuals = [])

@app.route('/getSongQualities', methods=['POST'])
def getSongQualities():
    try:
        token_info = get_token()
    except:
        print("User not logged in.")
        return redirect(url_for("login", _external=False))
    global songQuals
    nameSong = request.form['songqualities']
    sp = spotipy.Spotify(auth=token_info['access_token'])
    songQualityData = sp.audio_features(nameSong)
    #songAnalysis = sp.audio_analysis(songsNameId[0][1])
    songQuals.append(songQualityData)
    print(songQualityData)

    #print(songAnalysis)
    return render_template("test_songs.html", song_data = songsNameId, qualities = songQuals)

#Procedure for determining if token needs refreshed.
def get_token():
    token_info = session.get(TOKEN_INFO, None)
    if not token_info:
        raise 'exception'
    now = int(time.time())
    is_expired = token_info["expires_at"] - now < 60
    if(is_expired):
        oauth_obj = create_spotify_oauth() 
        token_info = oauth_obj.refresh_access_token(token_info['refresh_token'])
    return token_info

#Spotify oauth login object - called each time a create_spofify_oauth object is created.
def create_spotify_oauth():
    return SpotifyOAuth(
        client_id= "23f5d985314741b5a25842b62db322bb",
        client_secret = "597e08de27544a43b279500c309c7ea3",
        redirect_uri = url_for('redirectPage', _external=True),
        scope="user-library-read")  #This might change...

