import { Artist, Artista, Cancion, interactions, PrismaClient, Track, User } from '@prisma/client';
import { Response, Request } from 'express';
import { getUsersAndInfo } from '../Controllers/Prisma.controller';
import { resSend } from '../Utils/response';

const addTracksAndSongs = async (prisma: PrismaClient, tracks: (Cancion & { artists: Artista[] })[], artists: Artista[]) => {
    const tracksDb = await prisma.cancion.findMany({
        select: {
            id: true,
        },
    });
    const tracksIds = tracksDb.map((track) => track.id);
    const artistsInDb = await prisma.artista.findMany({
        select: {
            id: true,
        },
    });
    const artistsIds = artistsInDb.map((artist) => artist.id);

    await Promise.all(tracks.map(async (track) => {
        if (tracksIds.includes(track.id)) {
            return;
        }
        await Promise.all(track.artists.map(async (artist: any) => {
            if (artistsIds.includes(artist.id)) {
                return;
            }
            await prisma.artista.create({
                data: {
                    id: artist.id,
                    name: artist.name,
                    image: artist.images[0].url,
                    genres: artist.genres,
                },
            });
            artistsIds.push(artist.id);
        }));
        const newCancion = await prisma.cancion.create({
            include: {
                ArtistXCancion: {
                    include: {
                        cancion: true,
                        artista: true,
                    }
                }
            },
            data: {
                id: track.id,
                name: track.name,
                albumImage: track.albumImage,
                albumName: track.albumName,
                albumId: track.albumId,
                preview_url: track.preview_url,
                duration: track.duration,
                genres: track.genres,
                artistsId: track.artists.map((artist) => artist.id),
                ArtistXCancion: {
                    createMany: {
                        data: track.artists.map((artist) => ({
                            artistId: artist.id,
                        })),
                    },
                },
            }
        });
        tracksIds.push(newCancion.id);
    }));

    await Promise.all(artists.map(async (artist: Artista) => {
        if (artistsIds.includes(artist.id)) {
            return;
        }
        await prisma.artista.create({
            data: {
                id: artist.id,
                name: artist.name,
                genres: artist.genres,
                image: artist.image,
            }
        });
    }));
};

export const prismaGetUsers = async (prisma: PrismaClient) => {
    const users = await prisma.user.findMany();
    return users;
};

export const prismaAddUser = async (prisma: PrismaClient, user: User & { tracks: (Cancion & { artists: Artista[] })[], artists: Artista[] }) => {
    await addTracksAndSongs(prisma, user.tracks, user.artists);

    const tracksData: Omit<Track, 'fkUser'>[] = user.tracks.map((track, index: number) => ({
        trackId: track.id,
        orden: index + 1,
    }));

    const artistsData: Omit<Artist, 'fkUser' | 'cancionId'>[] = user.artists.map((artist, index: number) => ({
        artistId: artist.id,
        orden: index + 1,
    }));
    const newUser = await prisma.user.create({
        data: {
            spotifyId: user.spotifyId,
            username: user.username,
            description: user.description,
            avatarId: user.avatarId,
            tracks: {
                create: tracksData
            },
            artists: {
                create: artistsData
            },
        },
        include: {
            tracks: true,
            artists: true,
        }
    });
    console.log(newUser);
    return newUser;
};

export const getUserById = async (prisma: PrismaClient, userId: string) => {
    try {
        const user = await prisma.user.findUnique({
            where: {
                spotifyId: userId,
            }
        });
        if (!user) {
            return resSend(404, { error: 'User not found' });
        }
        return resSend(200, user);
    } catch (error: any) {
        return resSend(500, error);
    }
};

export const getUserInfo = async (prisma: PrismaClient, user: User) => {
    const userWithInfo: User & { tracks: Track[], artists: Artist[] } | null = await prisma.user.findFirst({
        where: {
            spotifyId: user.spotifyId,
        },
        include: {
            tracks: {
                orderBy: {
                    orden: 'asc',
                }
            },
            artists: {
                orderBy: {
                    orden: 'asc',
                }
            },
        },
    });
    return userWithInfo;
};

export const getNotMatchedUsers = async (prisma: PrismaClient, req: Request, res: Response, userId: string) => {
    try {
        const matchedIds = await prisma.interactions.findMany({
            where: {
                madeById: userId,
            }
        }).then((interactions: interactions[]) => {
            return interactions.map((interaction) => interaction.interactedWithId);
        });
        const users = await prisma.user.findMany({
            where: {
                AND: [
                    {
                        spotifyId: {
                            not: userId,
                        }
                    },
                    {
                        spotifyId: {
                            notIn: matchedIds,
                        }
                    }
                ]
            },
            include: {
                tracks: true,
                artists: true,
            },
        });
        // console.log(users);

        req.body = users;
        req.cookies.doReturn = 'true';
        const usersWithInfo: any = await getUsersAndInfo(req, res);
        return resSend(200, usersWithInfo);
    } catch (error: any) {
        return resSend(500, error);
    }
};

export const addInteraction = async (prisma: PrismaClient, userId: string, interactedWithId: string, decision: boolean) => {
    try {
        const haveInteraction = await prisma.interactions.findMany({
            where: {
                AND: [
                    {
                        interactedWithId: {
                            equals: userId
                        }
                    },
                    {
                        madeById: {
                            equals: interactedWithId
                        }
                    }
                ]
            }
        });
        const interaction = await prisma.interactions.create({
            data: {
                madeById: userId,
                interactedWithId,
                decision,
                timestamp: new Date(),
            }
        });
        return resSend(201, {
            ...interaction,
            match: haveInteraction.length > 0,
        });
    } catch (error: any) {
        return resSend(500, error);
    }
};

export const prismaGetUsersWithInfo = async (prisma: PrismaClient, user: User) => {
    try {
        const users = await prisma.user.findMany({
            where: {
                spotifyId: {
                    equals: user.spotifyId,
                }
            },
            include: {
                tracks: {
                    select: {
                        cancion: true
                    },
                },
                artists: true,
            },
        });
        console.log(users);

        return users;
    } catch (error: any) {
        console.log('error', error);
        return [];
    }
};
