import { Router } from 'express';
import { getUsers, addUser } from '../Controllers/Database.controller';

const databaseRouter = Router();

databaseRouter.get('/getusers', getUsers);
databaseRouter.post('/adduser', addUser);

export default databaseRouter;
