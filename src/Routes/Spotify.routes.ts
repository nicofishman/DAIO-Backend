import { Router } from 'express';
import {
    getByArtistName,
    login,
    userTopArtists,
    callback,
    userTopTracks,
    getAccessToken,
    me,
    getByAlbum,
    getBySong,
    getSongById,
    getArtistById
} from '../Controllers/Spotify.controller';

const routerSpotify = Router();

routerSpotify.get('/artist/:artist', getByArtistName);
routerSpotify.get('/album/:album', getByAlbum);
routerSpotify.get('/song/:song', getBySong);
routerSpotify.get('/songid/:id', getSongById);
routerSpotify.get('/artistid/:id', getArtistById);
routerSpotify.get('/login', login);
routerSpotify.get('/callback', callback);
routerSpotify.get('/topartists', userTopArtists);
routerSpotify.get('/toptracks', userTopTracks);
routerSpotify.get('/token', getAccessToken);
routerSpotify.get('/me', me);

export default routerSpotify;
