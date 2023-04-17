from flask import Flask, session, redirect, url_for, request, render_template, jsonify
from flask_restful import Api
import spotipy
from spotipy.oauth2 import SpotifyOAuth
from flask_cors import CORS

import time

app = Flask(__name__)
api = Api(app)
app.config['SESSION_COOKIE_NAME'] = 'maestro_cookie'
TOKEN_INFO = "token_info"

# Set up CORS headers
CORS(app, resources={r"/*": {"origins": "http://localhost:3000"}})


@app.after_request
def after_request(response):
    response.headers.add('Access-Control-Allow-Credentials', 'true')
    return response

# Home Page - default route
@app.route('/')
def home():
    token = request.args.get('access_token')
    return render_template("index.html", token=token)

# Login procedure - called on button in HTML.
# @app.route('/login', methods=['POST'])
# def login():
#     oauth_obj = create_spotify_oauth()
#     auth_url = oauth_obj.get_authorize_url()
#     return redirect(auth_url)


# Where Spotify app redirects after user logs in.
# Right now it immediately calls getPlaylist function (this will likely change).
@app.route('/redirect')
def redirect_page():
    oauth_obj = create_spotify_oauth()
    session.clear()
    code = request.args.get("code")
    token = oauth_obj.get_access_token(code)
    session[TOKEN_INFO] = token
    return redirect(url_for('get_playlist', _external=True))


# Get playlist function - gets token, gets info, returns string.
@app.route('/getPlaylist')
def get_playlist():
    try:
        token_info = get_token()
        sp = spotipy.Spotify(auth=token_info['access_token'])
        return jsonify(sp.current_user_saved_tracks(limit=5, offset=0)['items'])
    except Exception as e:
        print(e)
        return redirect(url_for("login", _external=False))


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