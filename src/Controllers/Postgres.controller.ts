import { Client } from 'pg';
import { User } from '../types';
import 'dotenv/config';
import { Request, Response } from 'express';

export const getUsers = async (_req: Request, res: Response): Promise<void> => {
    const client = new Client({
        connectionString: process.env.POSTGRES_URL,
        user: process.env.POSTGRES_USER,
        database: process.env.POSTGRES_NAME,
        password: process.env.POSTGRES_PASS,
        ssl: true,
    });
    client.connect();
    const query = 'SELECT * FROM users';
    client.query(query, (err: any, result: any) => {
        if (err) {
            console.log(err);
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
        connectionString: process.env.DATABASE_URL,
        ssl: true,
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
