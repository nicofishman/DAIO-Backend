import { PrismaClient } from '@prisma/client';
import { Request, Response } from 'express';
import * as prismaService from '../Services/Prisma.service';
import * as matchService from '../Services/Match.service';
import { getUsersAndInfo } from './Prisma.controller';
import { FullUser } from '../Utils/fullUser';

interface UserReturn extends FullUser {
    compatibility: number;
}

const prisma = new PrismaClient();

export const compareTwoUsers = async (req: Request, res: Response) => {
    const user1Id = req.get('user1Id');
    const user2Id = req.get('user2Id');
    if (!user1Id || !user2Id) {
        res.status(400).send({ error: 'Missing userId' });
        return;
    }

    const user1 = await prismaService.getUserById(prisma, user1Id);
    const user2 = await prismaService.getUserById(prisma, user2Id);

    if (user1.statusCode !== 200) {
        res.status(user1.statusCode).send(user1.body);
        return;
    } else if (user2.statusCode !== 200) {
        res.status(user2.statusCode).send(user2.body);
        return;
    }
    req.body = [user1.body, user2.body];
    req.cookies.doReturn = 'true';
    const usersInfo: any = await getUsersAndInfo(req, res);

    const response: any = matchService.compare(usersInfo[0], usersInfo[1]);

    res.status(response.statusCode).send(response.body);
};

export const getUsersFromUser = async (req: Request, res: Response) => {
    const userId = req.get('userId');
    const accessToken = req.get('accessToken');

    if (!userId) {
        res.status(400).send({ error: 'Missing userId' });
        return;
    }
    if (!accessToken) {
        res.status(401).send({ error: 'Missing accessToken' });
        return;
    }
    const myUser = await prismaService.getUserById(prisma, userId);
    if (myUser.statusCode !== 200) {
        res.status(myUser.statusCode).send(myUser.body);
        return;
    }
    req.body = [myUser.body];
    req.cookies.doReturn = 'true';
    const myUserInfo: any = await getUsersAndInfo(req, res);
    const miUsuario = myUserInfo[0];

    const notMatchedUsers: any = await prismaService.getNotMatchedUsers(prisma, req, res, userId);

    if (notMatchedUsers.statusCode !== 200) {
        res.status(notMatchedUsers.statusCode).send(notMatchedUsers.body);
        return;
    }
    if (notMatchedUsers.statusCode !== 200) {
        res.status(notMatchedUsers.statusCode).send(notMatchedUsers.body);
        return;
    }
    if (Array.isArray(notMatchedUsers.body) && notMatchedUsers.body.length === 0) {
        res.status(204).send({});
        return;
    }

    if (!Array.isArray(notMatchedUsers.body)) {
        res.status(500).send({ error: 'Error getting not matched users' });
        return;
    }
    const usersReturn: UserReturn[] = [];
    notMatchedUsers.body.forEach((user: FullUser) => {
        const compat: any = matchService.compare(user, miUsuario);
        if (compat.statusCode !== 200) {
            res.status(compat.statusCode).send(compat.body);
            return;
        }
        usersReturn.push({
            ...user,
            compatibility: compat.body.porcentajeDeCompatibilidad,
        });
    });
    res.status(200).send(usersReturn.sort((a, b) => b.compatibility - a.compatibility));
};
