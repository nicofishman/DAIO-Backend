import SpotifyWebApi from 'spotify-web-api-node';
import 'dotenv/config';
import { Request, Response } from 'express';

const spotifyApi: SpotifyWebApi = new SpotifyWebApi({
    clientId: process.env.SPOTIFY_CLIENT_ID,
    clientSecret: process.env.SPOTIFY_CLIENT_SECRET,
    redirectUri: process.env.SPOTIFY_REDIRECT_URI,
});

const resSend = (res: Response, data: Object) => {
    res.set({ 'content-type': 'application/json; charset=utf-8' });
    res.end(JSON.stringify(data, null, 2));
};

const scopes: string[] = [
    'ugc-image-upload',
    'user-read-playback-state',
    'user-modify-playback-state',
    'user-read-currently-playing',
    'streaming',
    'app-remote-control',
    'user-read-email',
    'user-read-private',
    'playlist-read-collaborative',
    'playlist-modify-public',
    'playlist-read-private',
    'playlist-modify-private',
    'user-library-modify',
    'user-library-read',
    'user-top-read',
    'user-read-playback-position',
    'user-read-recently-played',
    'user-follow-read',
    'user-follow-modify',
    'user-modify-playback-state',
];

const state = '';

export const login = (_req: Request, res: Response) => {
    res.redirect(spotifyApi.createAuthorizeURL(scopes, state));
};

export const callback = (req: Request, res: Response) => {
    const error = req.query.error;
    const code = req.query.code as string;
    if (code === undefined) {
        resSend(res, { error });
        return;
    }
    if (error) {
        console.log('Callback Error: ' + error);
        res.send('Callback Error: ' + error);
        return;
    }
    spotifyApi
        .authorizationCodeGrant(code)
        .then((data) => {
            const accessToken = data.body.access_token;
            const refreshToken = data.body.refresh_token;
            const expiresIn = data.body.expires_in;

            spotifyApi.setAccessToken(accessToken);
            spotifyApi.setRefreshToken(refreshToken);
            console.log('Refreshed!');
            // console.log('accessToken: ' + accessToken);
            // console.log('refreshToken: ' + refreshToken);

            // console.log(`The token expires in ${expiresIn} seconds`);
            res.redirect(req.cookies.redirect);

            setInterval(async () => {
                const data = await spotifyApi.refreshAccessToken();
                const accessToken = data.body.access_token;

                console.log('The token has been refreshed!');
                spotifyApi.setAccessToken(accessToken);
            }, (expiresIn / 2) * 1000);
        })
        .catch((err) => {
            console.log(
                'Something went wrong when retrieving an access token',
                err
            );
            res.send('Something went wrong when retrieving an access token');
        });
};

export const getAccessToken = (_req: Request, res: Response) => {
    const accessToken = spotifyApi.getAccessToken();
    res.send(accessToken);
};

export const getByAlbum = (req: Request, res: Response) => {
    if (spotifyApi.getAccessToken() == null) {
        res.cookie('redirect', `/spotify/album/${req.params.album}`);
        res.redirect('/spotify/login');
    } else {
        res.clearCookie('redirect');
        spotifyApi
            .searchAlbums(req.params.album)
            .then((data) => {
                resSend(res, data);
            })
            .catch((err) => {
                resSend(res, err);
            });
    }
};

export const getBySong = (req: Request, res: Response) => {
    if (spotifyApi.getAccessToken() == null) {
        res.cookie('redirect', `/spotify/song/${req.params.song}`);
        res.redirect('/spotify/login');
    } else {
        res.clearCookie('redirect');
        spotifyApi
            .searchTracks(req.params.song)
            .then((data) => {
                resSend(res, data);
            })
            .catch((err) => {
                resSend(res, err);
            });
    }
};

export const getByArtistName = (req: Request, res: Response) => {
    if (spotifyApi.getAccessToken() == null) {
        res.cookie('redirect', `/spotify/artist/${req.params.artist}`);
        res.redirect('/spotify/login');
    } else {
        res.clearCookie('redirect');
        spotifyApi
            .searchArtists(req.params.artist)
            .then((data) => {
                resSend(res, data);
            })
            .catch((err) => {
                resSend(res, err);
            });
    }
};

export const getActiveDevices = (_req: Request, res: Response) => {
    if (spotifyApi.getAccessToken() == null) {
        res.cookie('redirect', '/spotify/devices');
        res.redirect('/spotify/login');
    } else {
        res.clearCookie('redirect');
        spotifyApi
            .getMyDevices()
            .then((data) => {
                resSend(res, data);
            })
            .catch((err) => {
                resSend(res, err);
            });
    }
};

export const userTopArtists = (req: Request, res: Response) => {
    const topArtists: string[] = [];
    const accessToken = req.get('accessToken');
    // console.log('userTopArtists', accessToken?.length);
    if (accessToken == null) {
        console.log('accessToken is null');
        resSend(res, { error: 'No access token' });
        return;
    }
    spotifyApi.resetAccessToken();
    spotifyApi.setAccessToken(accessToken);
    spotifyApi.getMyTopArtists({ limit: 50 }).then(
        function (data) {
            data.body.items.forEach((artist) => {
                topArtists.push(artist.name);
            });
            res.end(JSON.stringify(topArtists));
        },
        function (err) {
            console.log('Something went wrong!', err);
        }
    );
};

export const userTopTracks = (req: Request, res: Response) => {
    const topTracks: string[] = [];
    const accessToken = req.get('accessToken');
    // console.log('userTopTracks', accessToken?.length);
    if (accessToken == null) {
        resSend(res, { error: 'No access token' });
        return;
    }
    spotifyApi.resetAccessToken();
    spotifyApi.setAccessToken(accessToken);
    spotifyApi.getMyTopTracks({ limit: 50 }).then(
        function (data) {
            data.body.items.forEach((track) => {
                topTracks.push(track.name);
            });
            res.end(JSON.stringify(topTracks));
        },
        function (err) {
            console.log('Something went wrong!, userTopTracks', err);
        }
    );
};

export const me = (req: Request, res: Response) => {
    const accessToken = req.get('accessToken');
    // console.log('me', accessToken?.length);
    if (accessToken == null) {
        resSend(res, { error: 'No access token' });
        return;
    }
    spotifyApi.resetAccessToken();
    spotifyApi.setAccessToken(accessToken);
    spotifyApi.getMe().then(
        function (data) {
            res.end(JSON.stringify(data.body));
        },
        function (err) {
            console.log('Something went wrong!', err);
        }
    );
};
