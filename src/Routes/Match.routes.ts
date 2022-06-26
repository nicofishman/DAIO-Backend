import { Router } from 'express';
import { compareTwoUsers } from '../Controllers/Match.controller';

const matchRouter = Router();

matchRouter.get('/compare', compareTwoUsers);

export default matchRouter;
