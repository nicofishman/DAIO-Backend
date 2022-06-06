import { Artist, PrismaClient, Track, User } from '@prisma/client';
import { getArtistById, getSongById } from './Spotify.service';

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

export const getUserInfo = async (prisma: PrismaClient, accessToken: string, user: User) => {
    const userWithInfo: User & {tracks: Track[], artists: Artist[]} | null = await prisma.user.findFirst({
        where: {
            spotifyId: user.spotifyId,
        },
        include: {
            tracks: {
                where: {
                    fkUser: user.spotifyId,
                },
            },
            artists: {
                where: {
                    fkUser: user.spotifyId,
                },
            },
        },
    });

    if (!userWithInfo) {
        console.log('User not found');
        throw new Error('User not found');
    }

    const userTracks: any[] = [];
    await Promise.all(userWithInfo.tracks.map(async (track: Track) => {
        const spotiTrack: any = await getSongById(accessToken, track.trackId);
        if (spotiTrack.statusCode !== 200) {
            console.log('Track not found');
            throw new Error('Track not found');
        }

        const myTrack = spotiTrack.body;
        userTracks.push({
            id: track.trackId,
            name: myTrack.name,
            preview_url: myTrack.preview_url,
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
    await Promise.all(userWithInfo.artists.map(async (artist: Artist) => {
        const spotiArtist: any = await getArtistById(accessToken, artist.artistId);
        const myArtist = spotiArtist.body;
        userArtists.push({
            id: artist.artistId,
            name: myArtist.name,
            images: myArtist.images,
            genres: myArtist.genres,
        });
    }));

    console.log({ canciones: userTracks.length, artistas: userArtists.length });

    return { canciones: userTracks, artistas: userArtists };
};
