import { Artist, PrismaClient, Track, User } from '@prisma/client';
import * as service from '../Services/Prisma.service';
import { resSend } from '../Utils/response';
import { Request, Response } from 'express';
import { getArtistById, getMultipleArtistsById, getSongById } from '../Services/Spotify.service';

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
    const doReturn = req.cookies.doReturn;

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
    const users = req.body.length > 0 || Object.keys(req.body).length !== 0 ? req.body : response.body;

    const prom = await Promise.all(users.map(async (user: User) => {
        // #region Get user info
        const userInfo: any = await service.getUserInfo(prisma, user)
            .then((userInfo) => {
                if (!userInfo) {
                    return resSend(404, 'User not found');
                }
                return resSend(200, userInfo);
            })
            .catch((error) => {
                throw (resSend(500, error));
            })
            .finally(async () => {
                await prisma.$disconnect();
            });

        if (userInfo.statusCode !== 200) {
            res.status(userInfo.statusCode).send(userInfo.body);
            return;
        }
        // #endregion
        const myUser: userDB = userInfo.body;
        const userTracks: any[] = [];
        await Promise.all(myUser.tracks.map(async (track: Track): Promise<void | object> => {
            const spotiTrack: any = await getSongById(accessToken, track.trackId);
            if (spotiTrack.statusCode !== 200) {
                throw spotiTrack;
            }
            const spotiArtists: any = await getMultipleArtistsById(accessToken, spotiTrack.body.artists.map((artist: any) => artist.id));
            if (spotiArtists.statusCode !== 200) {
                throw spotiArtists;
            }

            const trackGenres: string[] = [];
            spotiArtists.body.artists.forEach((artist: any) => {
                artist.genres.forEach((genre: string) => {
                    if (!trackGenres.includes(genre)) {
                        trackGenres.push(genre);
                    }
                }
                );
            });

            const myTrack = spotiTrack.body;

            userTracks.push({
                id: track.trackId,
                name: myTrack.name,
                preview_url: myTrack.preview_url,
                orden: track.orden,
                duration: myTrack.duration_ms,
                genres: trackGenres,
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
        }))
            .catch(async (error) => {
                throw error;
            });

        const userArtists: any[] = [];
        await Promise.all(myUser.artists.map(async (artist: Artist) => {
            const spotiArtist: any = await getArtistById(accessToken, artist.artistId);

            if (spotiArtist.statusCode !== 200) {
                throw spotiArtist;
            }

            const myArtist = spotiArtist.body;
            userArtists.push({
                id: artist.artistId,
                name: myArtist.name,
                images: myArtist.images,
                genres: myArtist.genres,
                orden: artist.orden,
            });
        }))
            .catch((error) => {
                throw error;
            });

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
    )
        .then(() => {
            return resSend(200, usersAndInfo);
        })
        .catch((error: any) => {
            return resSend(error.statusCode, error.body);
        });
    if (doReturn === 'true') {
        res.cookie('doReturn', 'false');
        return prom;
    } else {
        res.status(prom.statusCode).send(prom.body);
        return null;
    }
};

export const notMatchedUsers = async (req: Request, res: Response) => {
    const userId = req.get('userId');
    if (!userId) {
        res.status(401).send({ error: 'Missing userId' });
        return;
    }
    const response: any = await service.getNotMatchedUsers(prisma, req, res, userId);
    res.status(response.statusCode).send(response.body);
};

export const addInteraction = async (req: Request, res: Response) => {
    const { userId, interactedWith, decision }: {
        userId: string;
        interactedWith: string;
        decision: boolean;
    } = req.body;

    if (!userId || !interactedWith || decision === undefined) {
        res.status(401).send({ error: 'Missing userId, interactedWith or decision' });
        return;
    }
    const response: any = await service.addInteraction(prisma, userId, interactedWith, decision);
    res.status(response.statusCode).send(response.body);
};
