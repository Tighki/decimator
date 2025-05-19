import React, {useEffect, useCallback} from 'react';
import {createStyles, makeStyles, Theme} from "@material-ui/core/styles";
import {
    Button,
    Card,
    CardActions,
    CardContent,
    CardHeader,
    Checkbox,
    FormControl,
    IconButton,
    InputLabel,
    MenuItem,
    Paper,
    Select,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    TextField,
    Typography,
    Tooltip
} from "@material-ui/core";
import {
    Delete as DeleteIcon,
    PersonAdd as PersonAddIcon,
    Info as InfoIcon
} from "@material-ui/icons";
import Autocomplete from "@material-ui/lab/Autocomplete"
import {I_User} from "../../../types/user";
import {I_Organization} from "../../../types/org";
import {getToken} from "../../../utils/auth";
import {useToasts} from "react-toast-notifications";

const useStyles = makeStyles((theme: Theme) =>
    createStyles({
        rootMain: {
            width: '100%',
            marginTop: '10px',
            display: 'flex',
            flexDirection: 'column',
            gap: theme.spacing(3),
        },
        addUserContainer: {
            display: 'flex',
            flexDirection: 'column',
            gap: theme.spacing(2),
        },
        permissionsTable: {
            width: '100%',
        },
        infoBlock: {
            display: 'flex',
            alignItems: 'center',
            gap: theme.spacing(1),
            marginTop: theme.spacing(1),
        },
        formControl: {
            minWidth: 180,
        },
        actionButtons: {
            display: 'flex',
            justifyContent: 'flex-end',
        },
    }),
);

// Вспомогательные функции для работы с пользователями
const getNotUsedUsers = (used: I_User[], all: I_User[]) => {
    const used_ids = used.map(user => user._id);
    return all.filter((user) => used_ids.indexOf(user._id) === -1);
}

const get_users_by_ids = (users_ids: string[] | undefined, all: I_User[]) => {
    return all.filter((user) => users_ids?.indexOf(user._id) !== -1);
};

type OrgUsersManagerProp = {
    org: I_Organization | null
    setPending: Function
    updateOrgUsers: Function
};

const OrgUsersManager = ({org, setPending, updateOrgUsers}: OrgUsersManagerProp) => {
    const classes = useStyles();
    const {addToast} = useToasts();

    const [userToAdd, setUserToAdd] = React.useState<I_User | null>(null);
    const [selectedPermission, setSelectedPermission] = React.useState<'read' | 'write'>('read');
    const [users, setUsers] = React.useState<I_User[]>([]);
    const [readers, setReaders] = React.useState<I_User[]>([]);
    const [writers, setWriters] = React.useState<I_User[]>([]);
    const [selectedUsers, setSelectedUsers] = React.useState<string[]>([]);

    const allOrganizationUsers = [...readers, ...writers];

    const fetchUsers = useCallback(() => {
        const headers = new Headers();

        let token = getToken()
        headers.append("Authorization", token);
        headers.append("Accept", 'application/json');

        const options = {
            method: 'GET',
            headers
        };

        const route = `http://${process.env.REACT_APP_API_URI}/api/v1/users/`;
        setPending(true);
        fetch(route, options)
            .then(res => {
                setPending(false);
                return res.json();
            })
            .then(res => {
                if (res['detail']) {
                    throw (res['detail']);
                }
                setUsers(res);
            })
            .catch(error => {
                addToast('При загрузке списка пользователей произошла ошибка...', {
                    appearance: 'error',
                    autoDismiss: true,
                });
            });
    }, [setPending, addToast]);

    useEffect(() => {
        fetchUsers();
    }, [fetchUsers]);

    useEffect(() => {
        setWriters(get_users_by_ids(org?.canWrite, users));
        setReaders(get_users_by_ids(org?.canRead, users));
    }, [users, org]);

    const addUsersToOrganization = (userIds: (string | undefined)[], orgId: string | any, isWriter: boolean) => {
        const headers = new Headers();

        let token = getToken()
        headers.append("Authorization", token);
        headers.append("Accept", 'application/json');

        const options = {
            method: 'PUT',
            body: JSON.stringify(userIds),
            headers
        };
        const route = `http://${process.env.REACT_APP_API_URI}/api/v1/orgs/${orgId}/users?is_writer=${isWriter}`;
        setPending(true)
        fetch(route, options)
            .then(res => {
                setPending(false);
                return res.json();
            })
            .then(res => {
                if (res['detail']) {
                    throw (res['detail']);
                }
                updateOrgUsers(org?._id, res.find((o: I_Organization) => o._id === org?._id))
            })
            .catch(error => {
                addToast('При добавлении пользователей произошла ошибка...', {
                    appearance: 'error',
                    autoDismiss: true,
                });
            });
    };

    const deleteUsersFromOrganization = (userIds: string[], orgId: string | any) => {
        const headers = new Headers();

        let token = getToken()
        headers.append("Authorization", token);
        headers.append("Accept", 'application/json');
        headers.delete('Content-Type');

        const options = {
            method: 'DELETE',
            body: JSON.stringify(userIds),
            headers
        };

        const route = `http://${process.env.REACT_APP_API_URI}/api/v1/orgs/${orgId}/users`;
        setPending(true)
        fetch(route, options)
            .then(res => {
                setPending(false);
                return res.json();
            })
            .then(res => {
                if (res['detail']) {
                    throw (res['detail']);
                }
                updateOrgUsers(org?._id, res.find((o: I_Organization) => o._id === org?._id))
            })
            .catch(error => {
                addToast('Не удалось удалить пользователей из организации...', {
                    appearance: 'error',
                    autoDismiss: true,
                })
            });
    };

    const handleAddUser = () => {
        if (!userToAdd) return;
        
        const isReaderExist = readers.find((user) => user._id === userToAdd._id);
        const isWriterExist = writers.find((user) => user._id === userToAdd._id);
        
        if (isReaderExist || isWriterExist) {
            addToast('Пользователь уже добавлен в организацию', {
                appearance: 'warning',
                autoDismiss: true,
            });
            return;
        }
        
        addUsersToOrganization([userToAdd._id], org?._id, selectedPermission === 'write');
        
        if (selectedPermission === 'write') {
            setWriters([...writers, userToAdd]);
        } else {
            setReaders([...readers, userToAdd]);
        }
        
        setUserToAdd(null);
    };

    const handleChangePermission = (user: I_User, newPermission: 'read' | 'write') => {
        if (newPermission === 'write') {
            if (readers.find(r => r._id === user._id)) {
                setReaders(readers.filter(r => r._id !== user._id));
                setWriters([...writers, user]);
                addUsersToOrganization([user._id], org?._id, true);
            }
        } else {
            if (writers.find(w => w._id === user._id)) {
                setWriters(writers.filter(w => w._id !== user._id));
                setReaders([...readers, user]);
                addUsersToOrganization([user._id], org?._id, false);
            }
        }
    };

    const handleRemoveUser = (user: I_User) => {
        deleteUsersFromOrganization([user._id], org?._id);
        setReaders(readers.filter(r => r._id !== user._id));
        setWriters(writers.filter(w => w._id !== user._id));
    };

    const getUserPermissionType = (user: I_User): 'read' | 'write' => {
        return writers.find(w => w._id === user._id) ? 'write' : 'read';
    };

    const handleToggleSelectUser = (userId: string) => {
        if (selectedUsers.includes(userId)) {
            setSelectedUsers(selectedUsers.filter(id => id !== userId));
        } else {
            setSelectedUsers([...selectedUsers, userId]);
        }
    };

    const handleToggleSelectAll = () => {
        if (selectedUsers.length === allOrganizationUsers.length) {
            setSelectedUsers([]);
        } else {
            setSelectedUsers(allOrganizationUsers.map(user => user._id));
        }
    };

    const handleBulkChangePermission = (newPermission: 'read' | 'write') => {
        const userIds = selectedUsers;
        addUsersToOrganization(userIds, org?._id, newPermission === 'write');
        
        if (newPermission === 'write') {
            const usersToMove = readers.filter(user => selectedUsers.includes(user._id));
            setReaders(readers.filter(user => !selectedUsers.includes(user._id)));
            setWriters([...writers, ...usersToMove]);
        } else {
            const usersToMove = writers.filter(user => selectedUsers.includes(user._id));
            setWriters(writers.filter(user => !selectedUsers.includes(user._id)));
            setReaders([...readers, ...usersToMove]);
        }
        
        setSelectedUsers([]);
    };

    const handleBulkRemoveUsers = () => {
        deleteUsersFromOrganization(selectedUsers, org?._id);
        setReaders(readers.filter(user => !selectedUsers.includes(user._id)));
        setWriters(writers.filter(user => !selectedUsers.includes(user._id)));
        setSelectedUsers([]);
    };

    return (
        <div className={classes.rootMain}>
            <Card>
                <CardHeader title="Добавление пользователя в организацию" />
                <CardContent className={classes.addUserContainer}>
                    <Autocomplete
                        id="add-user-select"
                        options={getNotUsedUsers([...readers, ...writers], users) as I_User[]}
                        getOptionLabel={(option) => `${option.lastName} ${option.firstName} ${option.secondName}`}
                              value={userToAdd}
                        onChange={(_, value) => setUserToAdd(value)}
                        renderInput={(params) => (
                                  <TextField
                                      {...params}
                                label="Выбрать пользователя"
                                variant="outlined"
                            />
                        )}
                    />
                    <FormControl variant="outlined" className={classes.formControl}>
                        <InputLabel id="new-user-permission-label">Права доступа</InputLabel>
                        <Select
                            labelId="new-user-permission-label"
                            value={selectedPermission}
                            onChange={(e) => setSelectedPermission(e.target.value as 'read' | 'write')}
                            label="Права доступа"
                        >
                            <MenuItem value="read">Только чтение</MenuItem>
                            <MenuItem value="write">Чтение и запись</MenuItem>
                        </Select>
                    </FormControl>
                </CardContent>
                <CardActions className={classes.actionButtons}>
                    <Button
                        variant="contained"
                        color="primary"
                        disabled={!userToAdd}
                        onClick={handleAddUser}
                        startIcon={<PersonAddIcon />}
                >
                    Добавить пользователя
                </Button>
                </CardActions>
            </Card>

            <div>
                <div className={classes.infoBlock}>
                    <InfoIcon color="primary" />
                    <Typography variant="body2">
                        Пользователи с правами <b>Только чтение</b> могут просматривать документы, но не могут их изменять.
                    </Typography>
                </div>
                <div className={classes.infoBlock}>
                    <InfoIcon color="primary" />
                    <Typography variant="body2">
                        Пользователи с правами <b>Чтение и запись</b> могут просматривать и редактировать документы организации.
                    </Typography>
                </div>
            </div>

            <Card>
                <CardHeader 
                    title="Пользователи организации" 
                    action={
                        selectedUsers.length > 0 ? (
                            <div>
                                <Button 
                                    color="primary" 
                                    onClick={() => handleBulkChangePermission('read')}
                                    style={{ marginRight: 8 }}
                                >
                                    Только чтение
                        </Button>
                                <Button 
                                    color="primary" 
                                    onClick={() => handleBulkChangePermission('write')}
                                    style={{ marginRight: 8 }}
                                >
                                    Чтение и запись
                        </Button>
                                <Button 
                                color="secondary"
                                    onClick={handleBulkRemoveUsers}
                        >
                                    Удалить
                        </Button>
                            </div>
                        ) : null
                    }
                />
                <CardContent>
                    <TableContainer component={Paper}>
                        <Table>
                            <TableHead>
                                <TableRow>
                                    <TableCell padding="checkbox">
                                        <Checkbox
                                            checked={selectedUsers.length === allOrganizationUsers.length && allOrganizationUsers.length > 0}
                                            indeterminate={selectedUsers.length > 0 && selectedUsers.length < allOrganizationUsers.length}
                                            onChange={handleToggleSelectAll}
                                        />
                                    </TableCell>
                                    <TableCell>Пользователь</TableCell>
                                    <TableCell>Права доступа</TableCell>
                                    <TableCell>Действия</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {allOrganizationUsers.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={4} align="center">
                                            <Typography>Нет добавленных пользователей</Typography>
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    allOrganizationUsers.map((user) => (
                                        <TableRow key={user._id}>
                                            <TableCell padding="checkbox">
                                                <Checkbox
                                                    checked={selectedUsers.includes(user._id)}
                                                    onChange={() => handleToggleSelectUser(user._id)}
                                                />
                                            </TableCell>
                                            <TableCell>{user.lastName} {user.firstName} {user.secondName}</TableCell>
                                            <TableCell>
                                                <FormControl variant="outlined" size="small">
                                                    <Select
                                                        value={getUserPermissionType(user)}
                                                        onChange={(e) => handleChangePermission(user, e.target.value as 'read' | 'write')}
                                                    >
                                                        <MenuItem value="read">Только чтение</MenuItem>
                                                        <MenuItem value="write">Чтение и запись</MenuItem>
                                                    </Select>
                                                </FormControl>
                                            </TableCell>
                                            <TableCell>
                                                <Tooltip title="Удалить пользователя">
                                                    <IconButton 
                                                        onClick={() => handleRemoveUser(user)}
                                size="small"
                                                        color="secondary"
                                                    >
                                                        <DeleteIcon />
                                                    </IconButton>
                                                </Tooltip>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </TableContainer>
                </CardContent>
            </Card>
        </div>
    );
};

export default OrgUsersManager;