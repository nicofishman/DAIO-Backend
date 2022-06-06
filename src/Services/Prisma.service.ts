import { Artist, PrismaClient, Track, User } from '@prisma/client';

export const prismaGetUsers = async (prisma: PrismaClient) => {
    const users = await prisma.user.findMany();
    return users;
};

export const prismaAddUser = async (prisma: PrismaClient, user: any) => {
    const newUser = await prisma.user.create({
        data: {
            ...user,
        },
    });
    return newUser;
};

export const getUserInfo = async (prisma: PrismaClient, user: User) => {
    const userWithInfo: User & {tracks: Track[], artists: Artist[]} | null = await prisma.user.findFirst({
        where: {
            spotifyId: user.spotifyId,
        },
        include: {
            tracks: {
                where: {
                    fkUser: user.spotifyId,
                },
                orderBy: {
                    orden: 'asc',
                }
            },
            artists: {
                where: {
                    fkUser: user.spotifyId,
                },
                orderBy: {
                    orden: 'asc',
                }
            },
        },
    });
    return userWithInfo;
};
