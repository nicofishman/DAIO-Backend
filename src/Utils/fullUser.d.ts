export interface Image {
    height: number
    url: string
    width: number
}

export interface Artista {
    id: string
    name: string
    images: Image[]
    genres: string[]
    orden: number
}

export interface Artist {
    id: string
    name: string
}

export interface Album {
    id: string
    name: string
    img: string
}

export interface Cancione {
    id: string
    name: string
    preview_url: string
    orden: number
    duration: number
    genres: string[]
    album: Album
    artists: Artist[]
}

export interface FullUser {
    spotifyId: string
    username: string
    description: string
    avatarId: string
    canciones: Cancione[]
    artistas: Artista[]
}