import { Router } from 'express';
import {
    getUsers,
    addUser,
    getUsersAndInfo,
    notMatchedUsers,
    addInteraction,
    getInteractions
} from '../Controllers/Prisma.controller';

const databaseRouter = Router();

databaseRouter.get('/getusers', getUsers);
databaseRouter.post('/adduser', addUser);
databaseRouter.get('/getusersandinfo', getUsersAndInfo);
databaseRouter.get('/notmatchedusers', notMatchedUsers);
databaseRouter.post('/addinteraction', addInteraction);
databaseRouter.get('/getinteractions', getInteractions);

export default databaseRouter;
