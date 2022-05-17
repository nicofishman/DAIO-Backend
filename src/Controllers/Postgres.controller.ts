import 'dotenv/config';
import { Request, Response } from 'express';
import { Pool } from 'pg';

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
    console.log({
        connectionString: process.env.PGURL || process.env.POSTGRES_URL,
        user: process.env.PGUSER || process.env.PG_USER,
        database: process.env.PGNAME || process.env.PG_NAME,
        password: process.env.PGPASS || process.env.PG_PASS,
        ssl: false,
    });
    const client = new Pool();
    await client.connect();
    const query = 'SELECT * FROM users';
    client.query(query, (err: any, result: any) => {
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
    const client = new Pool({
        connectionString: process.env.PGURL || process.env.POSTGRES_URL,
        user: process.env.PGUSER || process.env.PG_USER,
        database: process.env.PGNAME || process.env.PG_NAME,
        password: process.env.PGPASS || process.env.PG_PASS,
        ssl: false,
    });
    client.connect();
    const query = `SELECT * FROM users WHERE spotifyId = '${user.spotifyId}'`;
    client.query(query, (err: any, result: any) => {
        if (err) {
            console.log(err);
            res.json(err);
        } else if (result.rows.length === 0) {
            const addUserQuery = `INSERT INTO users (spotifyId, username, avatarId, description) VALUES ('${user.spotifyId}', '${user.username}', ${user.avatarId}, '${user.description}')`;
            client.query(addUserQuery, (err: any, result: any) => {
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
