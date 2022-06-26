import { Artista, Cancione, FullUser } from '../Utils/fullUser';
import { resSend } from '../Utils/response';

const VALORES = {
    shareArtist: 10,
    shareTrack: 14,
};

/* TODO:
    -A: Si los usuarios comparten artista -> 10
    -B: Si los usuarios comparten cancion -> 14
    -----------A*3 + B*5 = 100--------------
    -C: Si los usuarios comparten album de cancion ->
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

    const artistIdShare = checkIntersections(user1ArtistsId, user2ArtistsId);
    user1Registro.artistas.push(...artistIdShare);
    user2Registro.artistas.push(...artistIdShare);
    porcentajeDeCompatibilidad += artistIdShare.length * VALORES.shareArtist;

    const user1TracksId = user1.canciones.map((track: Cancione) => track.id);
    const user2TracksId = user2.canciones.map((track: Cancione) => track.id);

    const trackIdShare = checkIntersections(user1TracksId, user2TracksId);
    user1Registro.canciones.push(...trackIdShare);
    user2Registro.canciones.push(...trackIdShare);
    porcentajeDeCompatibilidad += trackIdShare.length * VALORES.shareTrack;

    return resSend(200, { porcentajeDeCompatibilidad });
};
