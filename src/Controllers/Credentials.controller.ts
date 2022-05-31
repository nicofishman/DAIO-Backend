import 'dotenv/config';
import { Request, Response } from 'express';
import * as service from '../Services/Credentials.service';

export const getSpotifyCredentials = async (_req: Request, res: Response) => {
    const creds = await service.getFirebaseCredentials();
    res.json(creds);
};

export const getFirebaseCredentials = async (_req: Request, res: Response) => {
    const creds = await service.getFirebaseCredentials();
    res.json(creds);
};
