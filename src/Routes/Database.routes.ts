import { Router } from 'express';
import {
    getUsers,
    addUser,
    getUsersWithInfo,
    notMatchedUsers,
    addInteraction
} from '../Controllers/Prisma.controller';

const databaseRouter = Router();

databaseRouter.get('/getusers', getUsers);
databaseRouter.post('/adduser', addUser);
databaseRouter.get('/getusersandinfo', getUsersWithInfo);
databaseRouter.get('/notmatchedusers', notMatchedUsers);
databaseRouter.post('/addinteraction', addInteraction);

export default databaseRouter;
