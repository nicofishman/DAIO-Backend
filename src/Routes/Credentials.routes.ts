import { Router } from 'express';
import { getSpotifyCredentials, getFirebaseCredentials } from '../Controllers/Credentials.controller';

const routerCredentials = Router();

routerCredentials.get('/spotify', getSpotifyCredentials);
routerCredentials.get('/firebase', getFirebaseCredentials);

export default routerCredentials;
