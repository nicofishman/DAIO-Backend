import { Request, Response } from 'express';
import * as service from '../Services/Postgres.service';
import { DBUser } from '../Services/Postgres.service';

export const getUsers = async (_req: Request, res: Response): Promise<void> => {
    const response: any = await service.getUsers();
    res.status(response.statusCode).send(response.body);
};

export const addUser = async (req: Request, res: Response): Promise<void> => {
    const user: DBUser = req.body;
    const response: any = await service.addUser(user);

    res.status(response.statusCode).send(response.body);
};

export const getUsersAndInfo = async (req: Request, res: Response): Promise<void> => {
    const accessToken = req.get('accessToken');
    if (!accessToken) {
        res.status(401).send({ error: 'Missing accessToken' });
        return;
    }
    const response: any = await service.getUsers();
    if (response.statusCode !== 200) {
        res.status(response.statusCode).send(response.body);
    }
    const usersAndInfo: any = [];
    await Promise.all(response.body.map(async (user: DBUser) => {
        const userInfo: any = await service.getUserInfo(accessToken, user);
        usersAndInfo.push(userInfo.body);
    }));
    res.status(200).send(usersAndInfo);
};
