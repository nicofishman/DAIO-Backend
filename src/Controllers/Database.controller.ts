import 'dotenv/config';
import { Request, Response } from 'express';
import mysql, { MysqlError } from 'mysql';
import { User } from '../types';

export const getUsers = async (_req: Request, res: Response): Promise<void> => {
    const con = mysql.createConnection({
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASS,
        database: process.env.DB_NAME,
    });
    con.connect(function (err: MysqlError) {
        if (err) throw err;
        console.log('Connected!');
    });
    con.query('SELECT * FROM users', function (err: MysqlError, result: User[]) {
        if (err) throw err;
        console.log(result);
        res.json(result);
        con.end();
    });
};

export const addUser = async (req: Request, res: Response): Promise<void> => {
    const user: User = req.body;
    const con = mysql.createConnection({
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASS,
        database: process.env.DB_NAME,
    });
    con.connect(function (err: MysqlError) {
        if (err) throw err;
        console.log('Connected!');
    });

    const userBySpotifyIdQuery = `SELECT * FROM users WHERE spotifyId = '${user.spotifyId}'`;
    con.query(userBySpotifyIdQuery, function (err: MysqlError, result: User[]) {
        if (err) throw err;
        if (result.length === 0) {
            const addUserQuery = `INSERT INTO users (spotifyId, username, avatarId, description) VALUES ('${user.spotifyId}', '${user.username}', ${user.avatarId}, '${user.description}')`;
            con.query(addUserQuery, function (err: MysqlError, result: User[]) {
                if (err) throw err;
                console.log(result);
                res.json(result);
            });
        } else {
            console.log('User already exists');
            res.json('User Already Exists');
        }
        con.end();
    });
};
