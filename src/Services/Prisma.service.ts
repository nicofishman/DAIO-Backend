import { Artist, Artista, Cancion, interactions, PrismaClient, Track, User } from '@prisma/client';
import { Response, Request } from 'express';
import { getUsersAndInfo } from '../Controllers/Prisma.controller';
import { resSend } from '../Utils/response';

const addTracksAndSongs = async (prisma: PrismaClient, tracks: (Cancion & { artists: Artista[], external_urls: { spotify: string } })[], artists: (Artista & { external_urls: { spotify: string } })[]) => {
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
                    external_url: artist.external_urls?.spotify,
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
                external_url: track.external_urls?.spotify,
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

    await Promise.all(artists.map(
        async (artist: (Artista & { external_urls: { spotify: string } })) => {
            if (artistsIds.includes(artist.id)) {
                return;
            }
            await prisma.artista.create({
                data: {
                    id: artist.id,
                    name: artist.name,
                    genres: artist.genres,
                    image: artist.image,
                    external_url: artist.external_urls.spotify,
                }
            });
            artistsIds.push(artist.id);
        }
    ));
};

export const prismaGetUsers = async (prisma: PrismaClient) => {
    const users = await prisma.user.findMany();
    return users;
};

export const prismaAddUser = async (prisma: PrismaClient, user: User & { tracks: (Cancion & { artists: Artista[], external_urls: { spotify: string } })[], artists: (Artista & { external_urls: { spotify: string } })[] }) => {
    await addTracksAndSongs(prisma, user.tracks, user.artists);

    const tracksData: Omit<Track, 'fkUser'>[] = user.tracks.map((track, index: number) => ({
        trackId: track.id,
        orden: index + 1,
    }));

    const artistsData: Omit<Artist, 'fkUser' | 'cancionId'>[] = user.artists.map((artist, index: number) => ({
        artistId: artist.id,
        orden: index + 1,
    }));
    try {
        const newUser = await prisma.user.upsert({
            where: {
                spotifyId: user.spotifyId
            },
            update: {
                username: user.username,
                description: user.description,
                avatarId: user.avatarId,
                instagram: user.instagram,
                tracks: {
                    updateMany: tracksData.map((track) => ({
                        where: {
                            fkUser: user.spotifyId,
                            orden: track.orden,
                        },
                        data: {
                            trackId: track.trackId,
                        },
                    })),
                },
                artists: {
                    updateMany: artistsData.map((artist) => ({
                        where: {
                            fkUser: user.spotifyId,
                            orden: artist.orden,
                        },
                        data: {
                            artistId: artist.artistId,
                        },
                    })),
                }
            },
            create: {
                spotifyId: user.spotifyId,
                username: user.username,
                description: user.description,
                avatarId: user.avatarId,
                instagram: user.instagram,
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
    } catch (error: any) {
        console.log(error);

        throw new Error(error);
    }
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
        const usersDB = await prisma.user.findMany({
            select: {
                spotifyId: true,
            }
        });

        const users = usersDB.filter((user) => (user.spotifyId !== userId && !matchedIds.includes(user.spotifyId)));

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
                isMatch: haveInteraction.length > 0,
                timestamp: new Date(),
            },
            select: {
                isMatch: true,
            }
        });
        if (interaction.isMatch) {
            // update interaction in the other user to isMatch true
            await prisma.interactions.updateMany({
                where: {
                    AND: [
                        {
                            interactedWithId: {
                                equals: interactedWithId
                            }
                        },
                        {
                            madeById: {
                                equals: userId
                            }
                        }
                    ],
                },
                data: {
                    isMatch: true
                }
            });
        }
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
                        cancion: {
                            include: {
                                ArtistXCancion: {
                                    select: {
                                        artista: true,
                                    }
                                },
                            }
                        },
                    },
                },
                artists: {
                    select: {
                        artista: true,
                    }
                },
            },
        });

        const newUser = users.map((user) => {
            return {
                spotifyId: user.spotifyId,
                username: user.username,
                description: user.description,
                avatarId: user.avatarId,
                instagram: user.instagram,
                canciones: user.tracks.map((myTrack) => {
                    const track = myTrack.cancion;
                    return {
                        id: track.id,
                        name: track.name,
                        preview_url: track.preview_url,
                        external_url: track.external_url,
                        duration: track.duration,
                        genres: track.genres,
                        albumId: track.albumId,
                        albumImage: track.albumImage,
                        albumName: track.albumName,
                        artists: track.ArtistXCancion.map((artistXCancion) => {
                            const artist = artistXCancion.artista;
                            return {
                                ...artist
                            };
                        })
                    };
                }),
                artistas: user.artists.map((myArtist) => {
                    const artist = myArtist.artista;
                    return {
                        ...artist
                    };
                })
            };
        });
        return newUser;
    } catch (error: any) {
        return [];
    }
};

export const getInteractionsByUser = async (prisma: PrismaClient, userId: string) => {
    try {
        const interactions = await prisma.interactions.findMany({
            where: {
                madeById: userId,
            },
            include: {
                madeBy: true,
                interactedWith: true,
            },
            orderBy: {
                timestamp: 'desc',
            },
        });
        return resSend(200, interactions);
    } catch (error: any) {
        return resSend(500, error);
    }
};

export const getInteractionsByUserAndInteractedWith = async (prisma: PrismaClient, userId: string, interactedWithId: string) => {
    try {
        const interactions = await prisma.interactions.findMany({
            where: {
                AND: [
                    {
                        madeById: userId,
                    },
                    {
                        interactedWithId,
                    }
                ]
            },
            include: {
                madeBy: true,
                interactedWith: true,
            }
        });
        return resSend(200, interactions);
    } catch (error: any) {
        return resSend(500, error);
    }
};

export const getUsersAndInfoById = async (prisma: PrismaClient, userId: string) => {
    try {
        const user = await prisma.user.findUnique({
            where: {
                spotifyId: userId,
            },
            include: {
                tracks: {
                    select: {
                        cancion: {
                            include: {
                                ArtistXCancion: {
                                    select: {
                                        artista: true,
                                    }
                                },
                            }
                        },
                    },
                    orderBy: {
                        orden: 'asc',
                    }
                },
                artists: {
                    select: {
                        artista: true,
                    },
                    orderBy: {
                        orden: 'asc',
                    }
                },
            },
        });
        if (!user) {
            return resSend(404, { error: 'User not found' });
        }
        const newArtists: Artista[] = user.artists.map((artist) => {
            return {
                ...artist.artista,
            };
        });
        const newSongs = user.tracks.map((track) => {
            const { ArtistXCancion, ...newTrack } = track.cancion;
            return {
                ...newTrack,
                artists: track.cancion.ArtistXCancion.map((artistXCancion) => {
                    const artist = artistXCancion.artista;
                    return {
                        ...artist,
                    };
                }),
            };
        });
        user.tracks = newSongs as any;
        user.artists = newArtists as any;
        return resSend(200, user);
    } catch (error: any) {
        return resSend(500, error);
    }
};
