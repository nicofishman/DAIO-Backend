import { Router } from 'express';
import {
    getUsers,
    addUser,
    getUsersAndInfo,
    notMatchedUsers,
    addInteraction
} from '../Controllers/Prisma.controller';

const databaseRouter = Router();

databaseRouter.get('/getusers', getUsers);
databaseRouter.post('/adduser', addUser);
databaseRouter.get('/getusersandinfo', getUsersAndInfo);
databaseRouter.get('/notmatchedusers', notMatchedUsers);
databaseRouter.post('/addinteraction', addInteraction);

export default databaseRouter;
