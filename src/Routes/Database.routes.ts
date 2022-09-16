import { Router } from 'express';
import {
    getUsers,
    addUser,
    getUsersAndInfo,
    notMatchedUsers,
    addInteraction,
    getInteractions,
    getUsersAndInfoById,
    deleteUser
} from '../Controllers/Prisma.controller';

const databaseRouter = Router();

databaseRouter.get('/getusers', getUsers);
databaseRouter.get('/getusersandinfo', getUsersAndInfo);
databaseRouter.get('/getusersandinfo/:id', getUsersAndInfoById);
databaseRouter.get('/notmatchedusers', notMatchedUsers);
databaseRouter.get('/getinteractions', getInteractions);

databaseRouter.post('/adduser', addUser);
databaseRouter.post('/addinteraction', addInteraction);

databaseRouter.put('/updateuser', addUser);

databaseRouter.delete('/deleteuser/:spotifyid', deleteUser);

export default databaseRouter;
