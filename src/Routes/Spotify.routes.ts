import { Router } from 'express';
import {
    getByArtistName,
    login,
    callback,
    userTopArtists,
    userTopTracks,
    getAccessToken,
    me,
    getByAlbum,
    getActiveDevices,
    getBySong
} from '../Controllers/Spotify.controller';

const routerSpotify = Router();

routerSpotify.get('/artist/:artist', getByArtistName);
routerSpotify.get('/album/:album', getByAlbum);
routerSpotify.get('/song/:song', getBySong);
routerSpotify.get('/login', login);
routerSpotify.get('/callback', callback);
routerSpotify.get('/topartists', userTopArtists);
routerSpotify.get('/toptracks', userTopTracks);
routerSpotify.get('/token', getAccessToken);
routerSpotify.get('/me', me);
routerSpotify.get('/devices', getActiveDevices);

export default routerSpotify;
