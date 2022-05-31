import { Router } from 'express';
import {
    getUsers,
    addUser,
    getUsersAndInfo,
} from '../Services/Postgres.service';

const databaseRouter = Router();

databaseRouter.get('/getusers', getUsers);
databaseRouter.post('/adduser', addUser);
databaseRouter.get('/getusersandinfo', getUsersAndInfo);

export default databaseRouter;
