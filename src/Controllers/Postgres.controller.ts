import { Client } from 'pg';
import 'dotenv/config';
import { Request, Response } from 'express';
import { resSend } from './Spotify.controller';
import axios from 'axios';

type DBUser = {
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
    genres: string,
}

type Track = {
    id: string,
    name: string,
    artists: Artist[],
    album: Album,
    duration_ms: number,
}

// type UserAndInfo = {
//     id: number,
//     spotifyId: string,
//     username: string,
//     avatarId: 1|2|3|4|5|6|7|8|9|10|11|12|13|14|15,
//     description: string,
//     tracks: Track[],
//     artists: Artist[],
// }

// type Interaction = {
//     id: number,
//     madeById: string,
//     interactedWithId: string,
//     decision: boolean,
//     timestamp: Date
// }

// type itemXUser = {
//     id: number,
//     itemId: string,
//     userId: string,
//     order: number
// }

const getTrackInside = async (accessToken: string, trackId: string) => {
    const track = await axios.get(`https://api.spotify.com/v1/tracks/${trackId}?market=ES`, {
        headers: {
            Authorization: `Bearer ${accessToken}`
        }
    });
    return track.data;
};

export const getUsersAndInfo = async (req: Request, res: Response): Promise<void> => {
    const userId = req.get('userId');
    const accessToken = req.get('accessToken');
    if (!userId || !accessToken) {
        resSend(res, { error: 'Missing userId or accessToken' });
        return;
    }

    const client = new Client({
        connectionString: process.env.PGURI || process.env.DATABASE_URL,
        user: process.env.PGUSER,
        database: process.env.PGNAME || process.env.PGDATABASE,
        password: process.env.PGPASS || process.env.PGPASSWORD,
        ssl: { rejectUnauthorized: false }
    });
    await client.connect();
    const query = 'SELECT * FROM users WHERE "spotifyId" = $1';
    const result = await client.query(query, [userId]);
    const user: DBUser = result.rows[0];
    const query2 = 'SELECT * FROM trackxuser WHERE "fkUser" = $1 ORDER BY "orden" ASC';
    const result2 = await client.query(query2, [userId]);

    const tracks: Track[] = [];
    await Promise.all(result2.rows.map(async (row: any) => {
        const track = await getTrackInside(accessToken, row.trackId);
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

    console.log('tracks:', tracks);
    resSend(res, {
        spotifyId: user.spotifyId,
        username: user.username,
        avatarId: user.avatarId,
        description: user.description,
        canciones: tracks,
    });
};

export const getUsers = async (_req: Request, res: Response): Promise<void> => {
    const client = new Client({
        connectionString: process.env.PGURI || process.env.DATABASE_URL,
        user: process.env.PGUSER,
        database: process.env.PGNAME || process.env.PGDATABASE,
        password: process.env.PGPASS || process.env.PGPASSWORD,
        ssl: { rejectUnauthorized: false }
    });
    await client.connect();
    const query = 'SELECT * FROM users';
    client.query(query, (err: Error, result: any) => {
        if (err) {
            console.log('err' + err);
            res.json(err);
        } else {
            res.json(result.rows);
        }
        client.end();
    });
};

export const addUser = async (req: Request, res: Response): Promise<void> => {
    const user: DBUser = req.body;
    const client = new Client({
        connectionString: process.env.PGURI || process.env.DATABASE_URL,
        user: process.env.PGUSER,
        database: process.env.PGNAME || process.env.PGDATABASE,
        password: process.env.PGPASS || process.env.PGPASSWORD,
        ssl: { rejectUnauthorized: false }
    });
    client.connect();
    const query = `SELECT * FROM users WHERE "spotifyId" = '${user.spotifyId}'`;
    client.query(query, (err: any, result: any) => {
        if (err) {
            console.log(err);
            res.json(err);
        } else if (result.rows.length === 0) {
            const addUserQuery = 'INSERT INTO public.users("spotifyId", username, description, "avatarId") VALUES ($1, $2, $3, $4);';
            const values = [user.spotifyId, user.username, user.description, user.avatarId];
            client.query(addUserQuery, values, (err: any, result: any) => {
                if (err) {
                    console.log(err);
                    res.json(err);
                } else {
                    res.json(result);
                }
                client.end();
            });
        } else {
            console.log('User already exists');
            res.json('User Already Exists');
        }
    });
};
