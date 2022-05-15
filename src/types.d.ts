export type User = {
    id: number,
    spotifyId: string,
    username: string,
    avatarId: 1|2|3|4|5|6|7|8|9|10|11|12|13|14|15,
    description: string
}

export type Interaction = {
    id: number,
    madeById: string,
    interactedWithId: string,
    decision: boolean,
    timestamp: Date
}

export type itemXUser = {
    id: number,
    itemId: string,
    userId: string,
    order: number
}
