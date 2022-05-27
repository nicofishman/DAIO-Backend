import { Client } from 'pg';
import 'dotenv/config';
import { Request, Response } from 'express';

type User = {
    id: number,
    spotifyId: string,
    username: string,
    avatarId: 1|2|3|4|5|6|7|8|9|10|11|12|13|14|15,
    description: string
}

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
    const user: User = req.body;
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
