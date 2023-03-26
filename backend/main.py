from flask import Flask, send_from_directory, render_template, session, url_for, redirect, request
from flask_restful import Api, Resource, reqparse
import spotipy
from spotipy.oauth2 import SpotifyOAuth
from flask_cors import CORS, cross_origin

import os
import time

app = Flask(__name__)
api = Api(app)
app.secret_key = os.urandom(12)
app.config['SESSION_COOKIE_NAME'] = 'maestro_cookie'
TOKEN_INFO = "token_info"

# Set up CORS headers
cors = CORS(app, resources={r"/*": {"origins": "*"}})
app.config['CORS_ALLOW_CREDENTIALS'] = True

# Home Page - default route

# Login procedure - called on button in HTML.
@app.route('/login', methods=['POST'])
@cross_origin(supports_credentials=True)
def login():
    oauth_obj = create_spotify_oauth()
    auth_url = oauth_obj.get_authorize_url()
    return redirect(auth_url)


# Where Spotify app redirects after user logs in.
# Right now it immediately calls getPlaylist function (this will likely change).
@app.route('/redirect')
@cross_origin(supports_credentials=True)
def redirect_page():
    oauth_obj = create_spotify_oauth()
    session.clear()
    code = request.args.get("code")
    token = oauth_obj.get_access_token(code)
    session[TOKEN_INFO] = token
    response = redirect(url_for('get_playlist', _external=True))
    response.headers['Access-Control-Allow-Origin'] = 'http://localhost:3000'
    return response


# Get playlist function - gets token, gets info, returns string.
@app.route('/getPlaylist')
@cross_origin(supports_credentials=True)
def get_playlist():
    try:
        token_info = get_token()
    except:
        print("User not logged in.")
        return redirect(url_for("login", _external=False))
    sp = spotipy.Spotify(auth=token_info['access_token'])
    return str(sp.current_user_saved_tracks(limit=5, offset=0)['items'])


# Procedure for determining if token needs refreshed.
def get_token():
    token_info = session.get(TOKEN_INFO, None)
    if not token_info:
        raise Exception('Token info not found')
    now = int(time.time())
    is_expired = token_info["expires_at"] - now < 60
    if(is_expired):
        oauth_obj = create_spotify_oauth()
        token_info = oauth_obj.refresh_access_token(token_info['refresh_token'])
    return token_info

#Spotify oauth login object - called each time a create_spotify_oauth object is created.
def create_spotify_oauth():
    return SpotifyOAuth(
        client_id= "23f5d985314741b5a25842b62db322bb",
        client_secret = "597e08de27544a43b279500c309c7ea3",
        redirect_uri = url_for('redirect_page', _external=True),
        scope="user-library-read")  #This might change.
