export const resSend = (code: number, termo: object | string) => {
    if (typeof termo === 'string') {
        return {
            statusCode: code,
            body: {
                error: termo,
            },
        };
    } else {
        return {
            statusCode: code,
            body: termo,
        };
    }
};
