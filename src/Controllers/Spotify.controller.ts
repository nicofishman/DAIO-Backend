import { Request, Response } from 'express';
import * as service from '../Services/Spotify.service';

export const getByArtistName = async (req: Request, res: Response) => {
    const accessToken = req.get('accessToken');
    if (accessToken == null) {
        res.status(400).send({ error: 'No access token' });
        return;
    }
    const query = req.params.artist;
    const response: any = await service.getByArtistName(accessToken, query, res);
    res.status(response.statusCode).send(response.body);
};

export const login = async (_req: Request, res: Response) => {
    service.login(res);
};

export const callback = async (req: Request, res: Response) => {
    const error = req.query.error;
    const code = req.query.code as string;
    const redirect = req.cookies.redirect;
    if (code === undefined) {
        res.status(404).send(error);
        return;
    }
    if (error) {
        res.status(400).send(error);
        return;
    }
    await service.callback(res, redirect, code);
};

export const userTopArtists = async (req: Request, res: Response) => {
    const accessToken = req.get('accessToken');
    if (accessToken == null) {
        console.log('accessToken is null');
        res.status(400).send('No access token');
        return;
    }
    const response: any = await service.userTopArtists(accessToken);
    res.status(response.statusCode).send(response.body);
};

export const userTopTracks = async (req: Request, res: Response) => {
    const accessToken = req.get('accessToken');
    if (accessToken == null) {
        console.log('accessToken is null');
        res.status(400).send('No access token');
        return;
    }
    const response: any = await service.userTopTracks(accessToken);
    res.status(response.statusCode).send(response.body);
};

export const getAccessToken = (_req: Request, res: Response) => {
    const response: any = service.getAccessToken();
    res.status(response.statusCode).send(response.body);
};

export const me = async (req: Request, res: Response) => {
    const accessToken = req.get('accessToken');
    if (accessToken == null) {
        console.log('accessToken is null');
        res.status(400).send('No access token');
        return;
    }
    const response: any = await service.me(accessToken);
    res.status(response.statusCode).send(response.body);
};

export const getByAlbum = async (req: Request, res: Response) => {
    const accessToken: string | undefined = req.get('accessToken');
    if (accessToken == null) {
        console.log('accessToken is null');
        res.status(400).send('No access token');
        return;
    }
    const response: any = await service.getByAlbum(accessToken, req.params.album);
    res.status(response.statusCode).send(response.body);
};

export const getBySong = async (req: Request, res: Response) => {
    const accessToken: string | undefined = req.get('accessToken');
    if (accessToken == null) {
        console.log('accessToken is null');
        res.status(400).send('No access token');
        return;
    }
    const response: any = await service.getBySong(accessToken, req.params.song);
    res.status(response.statusCode).send(response.body);
};

export const getSongById = async (req: Request, res: Response) => {
    const accessToken: string | undefined = req.get('accessToken');
    if (accessToken == null) {
        console.log('accessToken is null');
        res.status(400).send('No access token');
        return;
    }
    const response: any = await service.getSongById(accessToken, req.params.id);
    res.status(response.statusCode).send(response.body);
};

export const getArtistById = async (req: Request, res: Response) => {
    const accessToken: string | undefined = req.get('accessToken');
    if (accessToken == null) {
        console.log('accessToken is null');
        res.status(400).send('No access token');
        return;
    }
    const response: any = await service.getArtistById(accessToken, req.params.id);
    res.status(response.statusCode).send(response.body);
};
