import { Router } from 'express';
import { compareTwoUsers, getUsersFromUser } from '../Controllers/Match.controller';

const matchRouter = Router();

matchRouter.get('/compare', compareTwoUsers);
matchRouter.get('/dameusuarios', getUsersFromUser);

export default matchRouter;
