import { PrismaClient } from '@prisma/client';
import { Request, Response } from 'express';
import * as prismaService from '../Services/Prisma.service';
import * as matchService from '../Services/Match.service';
import { getUsersAndInfo } from './Prisma.controller';

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
    console.log(usersInfo);

    const response: any = matchService.compare(usersInfo.body[0], usersInfo.body[1]);

    res.status(response.statusCode).send(response.body);
};
