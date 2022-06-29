import { Artist, interactions, PrismaClient, Track, User } from '@prisma/client';
import { Response, Request } from 'express';
import { getUsersAndInfo } from '../Controllers/Prisma.controller';
import { resSend } from '../Utils/response';

export const prismaGetUsers = async (prisma: PrismaClient) => {
    const users = await prisma.user.findMany();
    return users;
};

export const prismaAddUser = async (prisma: PrismaClient, user: User & { tracks: Track[], artists: Artist[] }) => {
    const tracksData: Omit<Track, 'fkUser'>[] = user.tracks.map((track: Track, index: number) => ({
        trackId: track.trackId,
        orden: index + 1,
    }));

    const artistsData: Omit<Artist, 'fkUser'>[] = user.artists.map((artist: Artist, index: number) => ({
        artistId: artist.artistId,
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
        console.log(users);

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
