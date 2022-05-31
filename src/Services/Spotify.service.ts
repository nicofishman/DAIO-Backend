import SpotifyWebApi from 'spotify-web-api-node';
import 'dotenv/config';
import { Request, Response } from 'express';

const spotifyApi: any = new SpotifyWebApi({
    clientId: process.env.SPOTIFY_CLIENT_ID,
    clientSecret: process.env.SPOTIFY_CLIENT_SECRET,
    redirectUri: process.env.SPOTIFY_REDIRECT_URI || 'http://localhost:3000/spotify/callback',
});

export const resSend = (res: Response, data: any) => {
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

export const login = (res: Response) => {
    res.redirect(spotifyApi.createAuthorizeURL(scopes, state));
};

export const callback = async (res: Response, redirect: string, code: string) => {
    let returnValue = {};
    await spotifyApi
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
            res.redirect(redirect);

            setInterval(async () => {
                const data = await spotifyApi.refreshAccessToken();
                const accessToken = data.body.access_token;

                console.log('The token has been refreshed!');
                spotifyApi.setAccessToken(accessToken);
            }, (expiresIn / 2) * 1000);
        })
        .catch((err: any) => {
            returnValue = err;
        });
    return returnValue;
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

export const getByArtistName = async (accessToken: string, query: string, res: Response) => {
    let returnValue = {};
    spotifyApi.resetAccessToken();
    spotifyApi.setAccessToken(accessToken);
    res.clearCookie('redirect');
    await spotifyApi
        .searchArtists(query)
        .then((data: any) => {
            returnValue = data;
        })
        .catch((err: any) => {
            returnValue = err;
        });

    return returnValue;
};

export const getSongById = (req: Request, res: Response) => {
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
        .getTrack(req.params.id)
        .then((data: any) => {
            resSend(res, data);
        })
        .catch((err: any) => {
            resSend(res, err);
        });
};

export const getArtistById = (req: Request, res: Response) => {
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
        .getArtist(req.params.id)
        .then((data: any) => {
            resSend(res, data);
        })
        .catch((err: any) => {
            resSend(res, err);
        });
};

export const userTopArtists = async (accessToken: string) => {
    // console.log('userTopArtists', accessToken?.length);
    spotifyApi.resetAccessToken();
    spotifyApi.setAccessToken(accessToken);
    let returnValue;

    await spotifyApi.getMyTopArtists({ limit: 50 }).then(
        function (data: any) {
            returnValue = [];
            data.body.items.forEach((artist: any) => {
                returnValue.push(artist.name);
            });
        },
        function (err: any) {
            returnValue = err;
        }
    );
    return returnValue;
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
