export const resSend = (code: number, termo: object | string) => {
    return {
        statusCode: code,
        body: termo,
    };
};
