import SpotifyWebApi from 'spotify-web-api-node';
import 'dotenv/config';
import { Request, Response } from 'express';

const spotifyApi: any = new SpotifyWebApi({
    clientId: process.env.SPOTIFY_CLIENT_ID,
    clientSecret: process.env.SPOTIFY_CLIENT_SECRET,
    redirectUri: process.env.SPOTIFY_REDIRECT_URI || 'http://localhost:3000/spotify/callback',
});

const resSend = (res: Response, data: any) => {
    res.set({ 'content-type': 'application/json; charset=utf-8' });
    res.statusCode = data.statusCode || 200;
    res.end(JSON.stringify(data.body || data, null, 2));
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
        resSend(res, { error });
        return;
    }
    spotifyApi
        .authorizationCodeGrant(code)
        .then((data: any) => {
            const accessToken = data.body.access_token;
            const refreshToken = data.body.refresh_token;
            const expiresIn = data.body.expires_in;

            spotifyApi.setAccessToken(accessToken);
            spotifyApi.setRefreshToken(refreshToken);
            console.log('Refreshed!');
            console.log('accessToken: ' + accessToken);
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
        .catch((err: any) => {
            console.log(
                'Something went wrong when retrieving an access token',
                err
            );
            resSend(res, 'Something went wrong when retrieving an access token');
        });
};

export const getAccessToken = (_req: Request, res: Response) => {
    try {
        const accessToken = spotifyApi.getAccessToken();
        resSend(res, accessToken);
    } catch (error) {
        console.log(error);
        resSend(res, error);
    }
};

export const getByAlbum = (req: Request, res: Response) => {
    if (spotifyApi.getAccessToken() == null) {
        res.cookie('redirect', `/spotify/album/${req.params.album}`);
        res.redirect('/spotify/login');
    } else {
        res.clearCookie('redirect');
        spotifyApi
            .searchAlbums(req.params.album)
            .then((data: any) => {
                resSend(res, data);
            })
            .catch((err: any) => {
                resSend(res, err);
            });
    }
};

export const getBySong = (req: Request, res: Response) => {
    const accessToken = req.get('accessToken');
    if (accessToken == null) {
        console.log('accessToken is null');
        resSend(res, { error: 'No access token' });
        return;
    }
    spotifyApi.resetAccessToken();
    spotifyApi.setAccessToken(accessToken);

    res.clearCookie('redirect');
    console.log(req.params.song);
    spotifyApi
        .searchTracks(req.params.song)
        .then((data: any) => {
            resSend(res, data);
        })
        .catch((err: any) => {
            resSend(res, err);
        });
};

export const getByArtistName = (req: Request, res: Response) => {
    const accessToken = req.get('accessToken');
    if (accessToken == null) {
        console.log('accessToken is null');
        resSend(res, { error: 'No access token' });
        return;
    }
    spotifyApi.resetAccessToken();
    spotifyApi.setAccessToken(accessToken);
    res.clearCookie('redirect');
    spotifyApi
        .searchArtists(req.params.artist)
        .then((data: any) => {
            resSend(res, data);
        })
        .catch((err: any) => {
            resSend(res, err);
        });
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
        function (data: any) {
            data.body.items.forEach((artist: any) => {
                topArtists.push(artist.name);
            });
            resSend(res, topArtists);
        },
        function (err: any) {
            resSend(res, err);
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
        function (data: any) {
            data.body.items.forEach((track: any) => {
                topTracks.push(track.name);
            });
            resSend(res, data);
        },
        function (err: any) {
            resSend(res, err);
        }
    );
};

export const me = async (req: Request, res: Response) => {
    const accessToken = req.get('accessToken');
    // console.log('me', accessToken?.length);
    if (accessToken == null) {
        resSend(res, { error: 'No access token' });
        return;
    }
    await spotifyApi.resetAccessToken();
    await spotifyApi.setAccessToken(accessToken);
    spotifyApi.getMe().then(
        function (data: any) {
            resSend(res, data);
        },
        function (err: any) {
            resSend(res, err);
        }
    );
};
