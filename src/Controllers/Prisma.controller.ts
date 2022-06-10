import { Artist, PrismaClient, Track, User } from '@prisma/client';
import * as service from '../Services/Prisma.service';
import { resSend } from '../Utils/response';
import { Request, Response } from 'express';
import { getArtistById, getSongById } from '../Services/Spotify.service';

type userDB = User & { tracks: Track[], artists: Artist[] };

const prisma = new PrismaClient();

export const getUsers = async (_req: Request, res: Response) => {
    const response = await service
        .prismaGetUsers(prisma)
        .then((users) => {
            return resSend(200, users);
        })
        .catch((error) => {
            return resSend(500, error);
        })
        .finally(async () => {
            await prisma.$disconnect();
        });

    res.status(response.statusCode).send(response.body);
};

export const addUser = async (req: Request, res: Response) => {
    const response = await service
        .prismaAddUser(prisma, req.body)
        .then((user) => {
            return resSend(201, user);
        })
        .catch((error) => {
            return resSend(500, error);
        })
        .finally(async () => {
            await prisma.$disconnect();
        });

    res.status(response.statusCode).send(response.body);
};

export const getUsersAndInfo = async (req: Request, res: Response) => {
    const accessToken = req.get('accessToken');
    if (!accessToken) {
        res.status(401).send({ error: 'Missing accessToken' });
        return;
    }
    const response: any = await service.prismaGetUsers(prisma)
        .then((users) => {
            return resSend(200, users);
        })
        .catch((error) => {
            return resSend(500, error);
        })
        .finally(async () => {
            await prisma.$disconnect();
        });
    if (response.statusCode !== 200) {
        res.status(response.statusCode).send(response.body);
    }
    const usersAndInfo: any = [];
    const users = response.body;

    await Promise.all(
        users.map(async (user: User) => {
            const userInfo: any = await service.getUserInfo(prisma, user)
                .then((userInfo) => {
                    if (!userInfo) {
                        console.log('User not found');
                        throw new Error('User not found');
                    }
                    return resSend(200, userInfo);
                })
                .catch((error) => {
                    Promise.reject(resSend(500, error));
                })
                .finally(async () => {
                    await prisma.$disconnect();
                });

            if (userInfo.statusCode !== 200) {
                res.status(userInfo.statusCode).send(userInfo.body);
            }
            const myUser: userDB = userInfo.body;
            const userTracks: any[] = [];
            await Promise.all(myUser.tracks.map(async (track: Track) => {
                const spotiTrack: any = await getSongById(accessToken, track.trackId);
                if (spotiTrack.statusCode !== 200) {
                    console.log('Track not found');
                    throw new Error(`Track not found: ${track.trackId}, ${spotiTrack.body}`);
                }

                const myTrack = spotiTrack.body;
                userTracks.push({
                    id: track.trackId,
                    name: myTrack.name,
                    preview_url: myTrack.preview_url,
                    orden: track.orden,
                    duration: myTrack.duration_ms,
                    album: {
                        id: myTrack.album.id,
                        name: myTrack.album.name,
                        img: myTrack.album.images[0].url,
                    },
                    artists: myTrack.artists.map((artist: any) => {
                        return {
                            id: artist.id,
                            name: artist.name,
                            images: artist.images,
                            genres: artist.genres,
                        };
                    }),
                });
            }));

            const userArtists: any[] = [];
            await Promise.all(myUser.artists.map(async (artist: Artist) => {
                const spotiArtist: any = await getArtistById(accessToken, artist.artistId);
                const myArtist = spotiArtist.body;
                userArtists.push({
                    id: artist.artistId,
                    name: myArtist.name,
                    images: myArtist.images,
                    genres: myArtist.genres,
                    orden: artist.orden,
                });
            }));

            userTracks.sort((a, b) => a.orden - b.orden);
            userArtists.sort((a, b) => a.orden - b.orden);
            userInfo.statusCode === 200 &&
                usersAndInfo.push(
                    {
                        ...user,
                        canciones: userTracks,
                        artistas: userArtists
                    });
        })
    );
    res.status(200).send(usersAndInfo);
};
