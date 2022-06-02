import { Client } from 'pg';
import 'dotenv/config';
// import { Response } from 'express';
import { resSend } from '../Utils/response';
import axios from 'axios';

export type DBUser = {
    id: number,
    spotifyId: string,
    username: string,
    avatarId: 1|2|3|4|5|6|7|8|9|10|11|12|13|14|15,
    description: string
}

type Album = {
    id: string,
    name: string,
    img: string,
}

type Artist = {
    id: string,
    name: string,
    images: {url: string}[],
    genres: string[],
}

type Track = {
    id: string,
    name: string,
    artists: Artist[],
    album: Album,
    duration_ms: number,
}
// type Interaction = {
//     id: number,
//     madeById: string,
//     interactedWithId: string,
//     decision: boolean,
//     timestamp: Date
// }

const getTrackInside = async (accessToken: string, trackId: string) => {
    try {
        const track = await axios.get(`https://api.spotify.com/v1/tracks/${trackId}?market=ES`, {
            headers: {
                Authorization: `Bearer ${accessToken}`
            }
        });
        return track.data;
    } catch (error: any) {
        console.log(error.response.status);
        return null;
    }
};

const getArtistInside = async (accessToken: string, artistId: string) => {
    try {
        const artist = await axios.get(`https://api.spotify.com/v1/artists/${artistId}?market=ES`, {
            headers: {
                Authorization: `Bearer ${accessToken}`
            }
        });
        return artist.data;
    } catch (error) {
        console.log(error);
        return null;
    }
};

export const getUserInfo = async (accessToken: string, user: DBUser) => {
    const client = new Client({
        connectionString: process.env.PGURI || process.env.DATABASE_URL,
        user: process.env.PGUSER,
        database: process.env.PGNAME || process.env.PGDATABASE,
        password: process.env.PGPASS || process.env.PGPASSWORD,
        ssl: { rejectUnauthorized: false }
    });
    await client.connect();
    const query2 = `SELECT * FROM trackxuser WHERE "fkUser" = '${user.spotifyId}' ORDER BY "orden" ASC`;
    const result2 = await client.query(query2)
        .then((resp: any) => resp);
    const tracks: Track[] = [];
    await Promise.all(result2.rows.map(async (row: any) => {
        const track = await getTrackInside(accessToken, row.trackId);
        if (!track) {
            return;
        }
        tracks.push({
            id: row.trackId,
            name: track.name,
            album: {
                id: track.album.id,
                name: track.album.name,
                img: track.album.images[0].url,
            },
            artists: track.artists.map((artist: any) => {
                return {
                    id: artist.id,
                    name: artist.name,
                    images: artist.images,
                    genres: artist.genres,
                };
            }),
            duration_ms: track.duration_ms,
        });
    }));

    const query3 = `SELECT * FROM artistxuser WHERE "fkUser" = '${user.spotifyId}' ORDER BY "orden" ASC`;
    const result3 = await client.query(query3);
    const artists: Artist[] = [];
    await Promise.all(result3.rows.map(async (row: any) => {
        const artist = await getArtistInside(accessToken, row.artistId);
        if (!artist) {
            return;
        }
        artists.push({
            id: row.artistId,
            name: artist.name,
            images: artist.images,
            genres: artist.genres,
        });
    }));
    return resSend(200, {
        ...user,
        canciones: tracks,
        artistas: artists,
        // artistas: artists,
    });
};

// export const getUsersAndInfo = async (req: Request, res: Response): Promise<void> => {
//     const userId = req.get('userId');
//     const accessToken = req.get('accessToken');
//     if (!accessToken) {
//         resSend(res, { error: 'Missing accessToken' });
//         return;
//     }

//     const users = await getUsers(req, res);
//     console.log('users', users);
//     const client = new Client({
//         connectionString: process.env.PGURI || process.env.DATABASE_URL,
//         user: process.env.PGUSER,
//         database: process.env.PGNAME || process.env.PGDATABASE,
//         password: process.env.PGPASS || process.env.PGPASSWORD,
//         ssl: { rejectUnauthorized: false }
//     });
//     await client.connect();
//     const query = 'SELECT * FROM users WHERE "spotifyId" = $1';
//     const result = await client.query(query, [userId]);
//     const user: DBUser = result.rows[0];
//     const query2 = 'SELECT * FROM trackxuser WHERE "fkUser" = $1 ORDER BY "orden" ASC';
//     const result2 = await client.query(query2, [userId]);

//     const tracks: Track[] = [];
//     await Promise.all(result2.rows.map(async (row: any) => {
//         const track = await getTrackInside(accessToken, row.trackId);
//         if (!track) {
//             return;
//         }
//         tracks.push({
//             id: row.trackId,
//             name: track.name,
//             album: {
//                 id: track.album.id,
//                 name: track.album.name,
//                 img: track.album.images[0].url,
//             },
//             artists: track.artists.map((artist: any) => {
//                 return {
//                     id: artist.id,
//                     name: artist.name,
//                     images: artist.images,
//                     genres: artist.genres,
//                 };
//             }),
//             duration_ms: track.duration_ms,
//         });
//     }));

//     const query3 = 'SELECT * FROM artistxuser WHERE "fkUser" = $1 ORDER BY "orden" ASC';
//     const result3 = await client.query(query3, [userId]);
//     const artists: Artist[] = [];
//     await Promise.all(result3.rows.map(async (row: any) => {
//         const artist = await getArtistInside(accessToken, row.artistId);
//         if (!artist) {
//             return;
//         }
//         artists.push({
//             id: row.artistId,
//             name: artist.name,
//             images: artist.images[0].url,
//             genres: artist.genres,
//         });
//     }));

//     resSend(res, {
//         spotifyId: user.spotifyId,
//         username: user.username,
//         avatarId: user.avatarId,
//         description: user.description,
//         canciones: tracks,
//         artistas: artists,
//     });
// };

export const getUsers = async () => {
    const client = new Client({
        connectionString: process.env.PGURI || process.env.DATABASE_URL,
        user: process.env.PGUSER,
        database: process.env.PGNAME || process.env.PGDATABASE,
        password: process.env.PGPASS || process.env.PGPASSWORD,
        ssl: { rejectUnauthorized: false }
    });
    await client.connect();
    const query = 'SELECT * FROM users';

    try {
        const returnValue = await client.query(query);
        return resSend(200, returnValue.rows);
    } catch (error: any) {
        // console.log('error', error);
        return resSend(500, error);
    }
};

export const addUser = async (user: DBUser) => {
    const client = new Client({
        connectionString: process.env.PGURI || process.env.DATABASE_URL,
        user: process.env.PGUSER,
        database: process.env.PGNAME || process.env.PGDATABASE,
        password: process.env.PGPASS || process.env.PGPASSWORD,
        ssl: { rejectUnauthorized: false }
    });
    await client.connect();
    const query = 'SELECT * FROM users WHERE "spotifyId" = $1';

    const response = await client.query(query, [user.spotifyId])
        .then(async (result: any) => {
            if (result.rowCount === 0) {
                let response2;
                const query2 = 'INSERT INTO users ("spotifyId", "username", "avatarId", "description") VALUES ($1, $2, $3, $4)';
                await client.query(query2, [user.spotifyId, user.username, user.avatarId, user.description])
                    .then((result2: any) => {
                        response2 = resSend(201, result2);
                    })
                    .catch((error: any) => {
                        // console.log('error', error);
                        response2 = resSend(500, error);
                    });
                return response2;
            } else {
                return resSend(200, 'user already in database');
            }
        })
        .catch(async (error: any) => {
            return resSend(500, error);
        });
    return response;
};
