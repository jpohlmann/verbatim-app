export const getFormattedDateTime = (date: string): string => {
    const dateObj = new Date(date);
    return dateObj.toUTCString();
}
export const getFormattedTime = (date: string): string => {
    const dateObj = new Date(date);
    return dateObj.toTimeString();
}