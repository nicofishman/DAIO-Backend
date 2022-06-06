import { PrismaClient, User } from '@prisma/client';
import * as service from '../Services/Prisma.service';
import { resSend } from '../Utils/response';
import { Request, Response } from 'express';

const prisma = new PrismaClient();

export const getUsers = async (_req: Request, res: Response) => {
    const response = await service
        .prismaGetUsers(prisma)
        .then((users) => {
            return resSend(200, users);
        })
        .catch((error) => {
            return resSend(500, error);
        })
        .finally(async () => {
            await prisma.$disconnect();
        });

    res.status(response.statusCode).send(response.body);
};

export const addUser = async (req: Request, res: Response) => {
    const response = await service
        .prismaAddUser(prisma, req.body)
        .then((user) => {
            return resSend(201, user);
        })
        .catch((error) => {
            return resSend(500, error);
        })
        .finally(async () => {
            await prisma.$disconnect();
        });

    res.status(response.statusCode).send(response.body);
};

export const getUsersAndInfo = async (req: Request, res: Response) => {
    const accessToken = req.get('accessToken');
    if (!accessToken) {
        res.status(401).send({ error: 'Missing accessToken' });
        return;
    }
    const response: any = await service
        .prismaGetUsers(prisma)
        .then((users) => {
            return resSend(200, users);
        })
        .catch((error) => {
            return resSend(500, error);
        })
        .finally(async () => {
            await prisma.$disconnect();
        });
    if (response.statusCode !== 200) {
        res.status(response.statusCode).send(response.body);
    }
    const usersAndInfo: any = [];

    await Promise.all(
        response.body.map(async (user: User) => {
            const userInfo: any = await service.getUserInfo(prisma, accessToken, user)
                .then((userInfo) => {
                    return resSend(200, userInfo);
                })
                .catch((error) => {
                    return resSend(500, error);
                })
                .finally(async () => {
                    await prisma.$disconnect();
                });
            usersAndInfo.push(userInfo.statusCode === 200 ?
                {
                    ...user,
                    ...userInfo.body
                } :
                []);
        })
    );
    res.status(200).send(usersAndInfo);
};
