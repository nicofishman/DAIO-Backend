import { Router } from 'express';
import {
    getUsers,
    addUser,
    getUsersAndInfo,
} from '../Controllers/Postgres.controller';

const databaseRouter = Router();

databaseRouter.get('/getusers', getUsers);
databaseRouter.post('/adduser', addUser);
databaseRouter.get('/getusersandinfo', getUsersAndInfo);

export default databaseRouter;
