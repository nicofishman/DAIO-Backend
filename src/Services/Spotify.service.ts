import SpotifyWebApi from 'spotify-web-api-node';
import 'dotenv/config';
import { Response } from 'express';

const spotifyApi: any = new SpotifyWebApi({
    clientId: process.env.SPOTIFY_CLIENT_ID,
    clientSecret: process.env.SPOTIFY_CLIENT_SECRET,
    redirectUri: process.env.SPOTIFY_REDIRECT_URI || 'http://localhost:3000/spotify/callback',
});
export const resSend = (code: number, termo: object) => {
    return {
        statusCode: code,
        body: termo,
    };
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

export const getAccessToken = () => {
    try {
        const accessToken = spotifyApi.getAccessToken();
        return (resSend(200, { accessToken }));
    } catch (error) {
        return (resSend(500, { error }));
    }
};

export const getByAlbum = async (accessToken: string, query: any) => {
    spotifyApi.resetAccessToken();
    spotifyApi.setAccessToken(accessToken);
    let returnValue = {};
    await spotifyApi
        .searchAlbums(query)
        .then((data: any) => {
            returnValue = resSend(200, data.body);
        })
        .catch((err: any) => {
            returnValue = resSend(err.statusCode, err);
        });
    return returnValue;
};

export const getBySong = async (accessToken: string, query: any) => {
    spotifyApi.resetAccessToken();
    spotifyApi.setAccessToken(accessToken);
    let returnValue = {};
    await spotifyApi
        .searchTracks(query)
        .then((data: any) => {
            returnValue = resSend(200, data.body);
        })
        .catch((err: any) => {
            returnValue = resSend(err.statusCode, err);
        });
    return returnValue;
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

export const getSongById = async (accessToken: string, query: string) => {
    spotifyApi.resetAccessToken();
    spotifyApi.setAccessToken(accessToken);
    let returnValue = {};
    await spotifyApi
        .getTrack(query)
        .then((data: any) => {
            returnValue = resSend(200, data.body);
        })
        .catch((err: any) => {
            returnValue = resSend(err.statusCode, err);
        });
    return returnValue;
};

export const getArtistById = async (accessToken: string, query: string) => {
    spotifyApi.resetAccessToken();
    spotifyApi.setAccessToken(accessToken);
    let returnValue = {};
    await spotifyApi
        .getArtist(query)
        .then((data: any) => {
            returnValue = resSend(200, data.body);
        })
        .catch((err: any) => {
            returnValue = resSend(err.statusCode, err);
        });
    return returnValue;
};

export const userTopArtists = async (accessToken: string) => {
    // console.log('userTopArtists', accessToken?.length);
    spotifyApi.resetAccessToken();
    spotifyApi.setAccessToken(accessToken);
    let returnValue;

    await spotifyApi.getMyTopArtists({ limit: 50 }).then(
        function (data: any) {
            const topArtists: string[] = [];
            data.body.items.forEach((artist: any) => {
                topArtists.push(artist.name);
            });
            returnValue = resSend(200, topArtists);
        },
        function (err: any) {
            returnValue = resSend(err.statusCode, { error: err });
        }
    );
    return returnValue;
};

export const userTopTracks = async (accessToken: string) => {
    const topTracks: string[] = [];
    let returnValue = {};
    spotifyApi.resetAccessToken();
    spotifyApi.setAccessToken(accessToken);
    await spotifyApi.getMyTopTracks({ limit: 50 }).then(
        function (data: any) {
            data.body.items.forEach((track: any) => {
                topTracks.push(track.name);
            });
            returnValue = resSend(200, topTracks);
        },
        function (err: any) {
            returnValue = resSend(err.statusCode, err);
        }
    );
    return returnValue;
};

export const me = async (accessToken: string) => {
    let returnValue = {};
    await spotifyApi.resetAccessToken();
    await spotifyApi.setAccessToken(accessToken);
    await spotifyApi.getMe().then(
        function (data: any) {
            returnValue = resSend(200, data.body);
        },
        function (err: any) {
            returnValue = resSend(err.statusCode, err);
        }
    );
    return returnValue;
};
