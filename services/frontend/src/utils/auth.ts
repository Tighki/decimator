interface User {
    access_token?: string,
    refresh_token?: string,
    login?: string
}

export const getToken = (isRefresh: boolean = false): string => {
    let storedUser: string | null = localStorage.getItem('current_user');
    let token: string = '';
    if (!Boolean(storedUser)) {
        return token;
    }

    let user: User = JSON.parse(storedUser!);

    if (user) {
        if (user.refresh_token !== undefined && user.access_token !== undefined) {
            token = `Bearer ${isRefresh ? user.refresh_token : user.access_token}`;
        }
    }
    return token;
};
