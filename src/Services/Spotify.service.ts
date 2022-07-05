import SpotifyWebApi from 'spotify-web-api-node';
import 'dotenv/config';
import { Response } from 'express';
import { resSend } from '../Utils/response';

const spotifyApi: any = new SpotifyWebApi({
    clientId: process.env.SPOTIFY_CLIENT_ID,
    clientSecret: process.env.SPOTIFY_CLIENT_SECRET,
    redirectUri: process.env.SPOTIFY_REDIRECT_URI || 'http://localhost:3000/spotify/callback',
});

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

export const getMultipleArtistsById = async (accessToken: string, query: string) => {
    spotifyApi.resetAccessToken();
    spotifyApi.setAccessToken(accessToken);
    let returnValue = {};
    try {
        await spotifyApi
            .getArtists(query)
            .then((data: any) => {
                returnValue = resSend(200, data.body);
            })
            .catch((err: any) => {
                returnValue = resSend(err.statusCode, err);
            });
        return returnValue;
    } catch (error) {
        return resSend(500, { error });
    }
};

export const userTopArtists = async (accessToken: string) => {
    // console.log('userTopArtists', accessToken?.length);
    spotifyApi.resetAccessToken();
    spotifyApi.setAccessToken(accessToken);
    let returnValue;

    await spotifyApi.getMyTopArtists({ limit: 50 }).then(
        function (data: any) {
            const topArtists: any = [];
            data.body.items.forEach((artist: any) => {
                topArtists.push({
                    id: artist.id,
                    name: artist.name,
                    image: artist.images[0].url,
                    genres: artist.genres,
                });
            });
            returnValue = resSend(200, topArtists);
        },
        function (err: any) {
            returnValue = resSend(err.statusCode, { error: err });
        }
    );
    return returnValue;
};

export const getSongById = async (accessToken: string, query: string) => {
    spotifyApi.resetAccessToken();
    spotifyApi.setAccessToken(accessToken);
    let returnValue = {};
    await spotifyApi
        .getTrack(query)
        .then(async (data: any) => {
            const track = data.body;
            const songArtists: any = await getMultipleArtistsById(accessToken, track.artists.map((art: any) => art.id));
            if (songArtists.statusCode !== 200) {
                returnValue = resSend(songArtists.statusCode, songArtists.body);
                return;
            }

            const genres: string[] = songArtists.body.artists.map((artist: any) => artist.genres).flat();

            const song = {
                id: track.id,
                name: track.name,
                img: track.album.images[0].url,
                artists: songArtists.body.artists,
                preview_url: track.preview_url,
                duration: track.duration_ms,
                albumId: track.album.id,
                albumName: track.album.name,
                albumImage: track.album.images[0].url,
                genres,
            };
            returnValue = resSend(200, song);
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
    const searched: any[] = [];
    await spotifyApi
        .searchTracks(query, { limit: 5 })
        .then(async (data: any) => {
            await Promise.all(data.body.tracks.items.map(async (track: any) => {
                const songArtists: any = await getMultipleArtistsById(accessToken, track.artists.map((art: any) => art.id));
                if (songArtists.statusCode !== 200) {
                    returnValue = resSend(songArtists.statusCode, songArtists.body);
                    return;
                }

                const genres: string[] = songArtists.body.artists.map((artist: any) => artist.genres).flat();

                searched.push({
                    id: track.id,
                    name: track.name,
                    img: track.album.images[0].url,
                    artists: songArtists.body.artists,
                    preview_url: track.preview_url,
                    duration: track.duration_ms,
                    albumId: track.album.id,
                    albumName: track.album.name,
                    albumImage: track.album.images[0].url,
                    genres,
                });
            }));
            returnValue = resSend(200, searched);
        })
        .catch((err: any) => {
            returnValue = resSend(err.statusCode, err);
        });
    return returnValue;
};

export const userTopTracks = async (accessToken: string) => {
    const topTracks: any = [];
    let returnValue = {};
    spotifyApi.resetAccessToken();
    spotifyApi.setAccessToken(accessToken);
    await spotifyApi.getMyTopTracks({ limit: 50 }).then(
        async function (data: any) {
            await Promise.all(data.body.items.map(async (track: any) => {
                const songArtists: any = await getMultipleArtistsById(accessToken, track.artists.map((art: any) => art.id));
                if (songArtists.statusCode !== 200) {
                    returnValue = resSend(songArtists.statusCode, songArtists.body);
                    return;
                }

                const genres: string[] = songArtists.body.artists.map((artist: any) => artist.genres).flat();

                topTracks.push({
                    id: track.id,
                    name: track.name,
                    img: track.album.images[0].url,
                    artists: songArtists.body.artists,
                    preview_url: track.preview_url,
                    duration: track.duration_ms,
                    albumId: track.album.id,
                    albumName: track.album.name,
                    albumImage: track.album.images[0].url,
                    genres,
                });
            }));
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

export const getGenreByArtists = async (accessToken: string, query: string[]) => {
    let returnValue = {};
    spotifyApi.resetAccessToken();
    spotifyApi.setAccessToken(accessToken);
    await spotifyApi.getArtists(query).then(
        function (data: any) {
            returnValue = resSend(200, data.body.artists[0].genres);
        },
        function (err: any) {
            returnValue = resSend(err.statusCode, err);
        }
    );
    return returnValue;
};
