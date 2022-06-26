import { Artista, Cancione, FullUser } from '../Utils/fullUser';
import { resSend } from '../Utils/response';

const VALORES = {
    shareArtist: 10,
    shareTrack: 14,
    shareTrackAlbum: 5,
    shareTrackArtist: 3,
    trackArtistShareArtist: 5,
};

/* TODO:
    -A: Si los usuarios comparten artista -> 10
    -B: Si los usuarios comparten cancion -> 14
    -----------A*3 + B*5 = 100--------------
    -C: Si los usuarios comparten album de cancion -> 5
    -D: Si los usuarios comparten artista de cancion ->
    ----------------------------------------
    -E: Si el artista de una canción de un usuario es el artista general del otro ->

    -F: Porcentaje de géneros que coinciden entre los usuarios
*/

type Registro = {
    artistas: string[],
    canciones: string[],
}

const checkIntersections = (user1: string[], user2: string[]) => {
    const intersection = user1.filter(x => user2.includes(x));
    return intersection;
};

const checkArtistInSongWithArtist = (user1: FullUser, user2: FullUser) => {
    const user1SongArtists: string[][] = user1.canciones.map(x => x.artists.map(y => y.id));
    const user1Artists: string[] = user1SongArtists.flat();
    const user2Artists = user2.artistas.map(x => x.id);
    const intersection = checkIntersections(user1Artists, user2Artists);
    return intersection.length;
};

const checkSameArtist = (user1: FullUser, user2: FullUser, user1Registro: Registro, user2Registro: Registro) => {
    const user1Artists: { songId: string, artistId: string }[] = [];
    const user2Artists: { songId: string, artistId: string }[] = [];

    user1.canciones.forEach(x => {
        if (!(user1Registro.canciones.includes(x.id))) {
            x.artists.forEach(y => {
                user1Artists.push({ songId: x.id, artistId: y.id });
            });
        }
    });

    user2.canciones.forEach(x => {
        if (!(user2Registro.canciones.includes(x.id))) {
            x.artists.forEach(y => {
                user2Artists.push({ songId: x.id, artistId: y.id });
            });
        }
    });

    const user1Intersection = user1Artists.filter(x => user2Artists.some(y => y.artistId === x.artistId));
    const user2Intersection = user2Artists.filter(x => user1Artists.some(y => y.artistId === x.artistId));

    return [user1Intersection, user2Intersection];
};

const checkSameAlbum = (user1: FullUser, user2: FullUser, user1Registro: Registro, user2Registro: Registro) => {
    const user1Albums: { id: string, albumId: string }[] = [];
    const user2Albums: { id: string, albumId: string }[] = [];

    user1.canciones.forEach(x => {
        if (!(user1Registro.canciones.includes(x.id))) {
            // console.log(x.name, x.id, '->', x.album.id);
            user1Albums.push({ id: x.id, albumId: x.album.id });
        }
    });
    user2.canciones.forEach(x => {
        if (!(user2Registro.canciones.includes(x.id))) {
            // console.log(x.name, x.id, '->', x.album.id);
            user2Albums.push({ id: x.id, albumId: x.album.id });
        }
    });

    const user1Intersection = user1Albums.filter(x => user2Albums.some(y => y.albumId === x.albumId));
    const user2Intersection = user2Albums.filter(x => user1Albums.some(y => y.albumId === x.albumId));
    return [user1Intersection, user2Intersection];
};

export const compare = (user1: FullUser, user2: FullUser) => {
    let porcentajeDeCompatibilidad = 0;

    const user1Registro: Registro = {
        artistas: [],
        canciones: [],
    };

    const user2Registro: Registro = {
        artistas: [],
        canciones: [],
    };

    const user1ArtistsId = user1.artistas.map((artist: Artista) => artist.id);
    const user2ArtistsId = user2.artistas.map((artist: Artista) => artist.id);

    const ruleA = checkIntersections(user1ArtistsId, user2ArtistsId);
    user1Registro.artistas.push(...ruleA);
    user2Registro.artistas.push(...ruleA);
    porcentajeDeCompatibilidad += ruleA.length * VALORES.shareArtist;

    const user1TracksId = user1.canciones.map((track: Cancione) => track.id);
    const user2TracksId = user2.canciones.map((track: Cancione) => track.id);

    const ruleB = checkIntersections(user1TracksId, user2TracksId);
    user1Registro.canciones.push(...ruleB);
    user2Registro.canciones.push(...ruleB);
    porcentajeDeCompatibilidad += ruleB.length * VALORES.shareTrack;

    const [user1C, user2C] = checkSameAlbum(user1, user2, user1Registro, user2Registro);
    user1Registro.canciones.push(...user1C.map(x => x.id));
    user2Registro.canciones.push(...user2C.map(x => x.id));
    porcentajeDeCompatibilidad += user1C.length * VALORES.trackArtistShareArtist;

    const [user1D, user2D] = checkSameArtist(user1, user2, user1Registro, user2Registro);
    user1Registro.canciones.push(...user1D.map(x => x.songId));
    user2Registro.canciones.push(...user2D.map(x => x.songId));
    porcentajeDeCompatibilidad += user1D.length * VALORES.trackArtistShareArtist;

    const ruleE = checkArtistInSongWithArtist(user1, user2);
    console.log(ruleE);

    return resSend(200, { porcentajeDeCompatibilidad });
};
