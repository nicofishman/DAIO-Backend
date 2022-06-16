import { Artist, PrismaClient, Track, User } from '@prisma/client';

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
