import React, {useEffect} from 'react';
import {fade, makeStyles, Theme} from '@material-ui/core/styles';
import {
    Button,
    Divider,
    Drawer,
    FormControl,
    IconButton,
    InputBase,
    InputLabel,
    List,
    ListItemIcon,
    MenuItem,
    Select,
    Typography
} from '@material-ui/core';
import ListItem from "@material-ui/core/ListItem";
import ListItemText from "@material-ui/core/ListItemText";
import DeleteIcon from "@material-ui/icons/Delete";
import {Edit, Folder, Search} from "@material-ui/icons";
import {useToasts} from "react-toast-notifications";
import {I_FolderGroup, I_Organization} from "../../types/org";
import {getToken} from "../../utils/auth";
import {I_Folder} from "../../types/folder";
import {I_CurrentUser} from "../../types/user";
import AddFolderDialog from "../org/dialogs/AddFolderDialog";
import DeleteFolderDialog from "../org/dialogs/DeleteFolderDialog";
import EditFolderDialog from "../org/dialogs/EditFolderDialog";


const useStyles = makeStyles((theme: Theme) => ({
    root: {
        display: 'flex',
        height: '100%'
    },
    toolbarButtonsDiv: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'flex-end',
        padding: '0 8px',
        ...theme.mixins.toolbar,
    },
    addFolderButton: {
        marginRight: '5px'
    },
    search: {
        position: 'relative',
        borderRadius: theme.shape.borderRadius,
        backgroundColor: fade(theme.palette.common.black, 0.15),
        '&:hover': {
            backgroundColor: fade(theme.palette.common.black, 0.25),
        },
        marginRight: theme.spacing(2),
        marginLeft: 0,
        width: '100%',
        [theme.breakpoints.up('sm')]: {
            marginLeft: theme.spacing(0.5),
            marginRight: theme.spacing(0.5),
            width: 'auto',
        },
    },
    searchIcon: {
        padding: theme.spacing(0, 2),
        height: '100%',
        position: 'absolute',
        pointerEvents: 'none',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
    },
    searchInputRoot: {
        color: 'inherit',
    },
    searchInputInput: {
        padding: theme.spacing(1, 1, 1, 0),
        // vertical padding + font size from searchIcon
        paddingLeft: `calc(1em + ${theme.spacing(4)}px)`,
        transition: theme.transitions.create('width'),
        width: '100%',
        [theme.breakpoints.up('md')]: {
            width: '20ch',
        },
    },
    selectedFolder: {
        backgroundColor: "#dedede",
        "&:hover": {
            backgroundColor: "steelblue"
        }
    },
    unselectedFolder: {},
    leftPanel: {
        display: 'flex',
        flexDirection: 'column',
    },
    leftPanelHeader: {
        height: '20%'
        // height: '100%'
    },
    drawerPaper: {
        position: 'relative',
        height: '100%',
        whiteSpace: 'nowrap',
    },
    drawer: {
        height: '80%',
        maxWidth: '270px',
    },
    formControl: {
        // padding: theme.spacing(1),
        width: '90%',
        maxWidth: '225px',
        marginTop: theme.spacing(1),
        marginBottom: theme.spacing(3),
        marginLeft: theme.spacing(1),
        marginRight: theme.spacing(1),
    },
    selectEmpty: {
        // marginTop: theme.spacing(2),
    },
}));

type SideBarProp = {
    selectedOrg: I_Organization | null
    setSelectedOrg: Function
    selectedFolder: I_Folder | null
    setDocuments: Function
    setSelectedFolder: Function
    folders: I_Folder[]
    setFolders: Function
    fetchFolders: Function
    selectedFgsId: string
    setSelectedFgsId: Function
    currentUser: I_CurrentUser | null
};

const DrawerSideBar = ({
                           selectedOrg,
                           setSelectedOrg,
                           currentUser,
                           selectedFolder,
                           setSelectedFolder,
                           setDocuments,
                           fetchFolders,
                           selectedFgsId,
                           setSelectedFgsId,
                           setFolders,
                           folders
                       }: SideBarProp) => {
    const classes = useStyles();
    const {addToast} = useToasts();

    const [fgs, setFgs] = React.useState<I_FolderGroup[]>([]);


    const [folderFilter, setFolderFilter] = React.useState<string>('');
    const [addFolderDialogOpen, setAddFolderDialogOpen] = React.useState<boolean>(false);
    const [delFolderDialogOpen, setDelFolderDialogOpen] = React.useState<boolean>(false);
    const [changeFolderDialogOpen, setChangeFolderDialogOpen] = React.useState<boolean>(false);

    let filteredFolders: I_Folder[] = folders.filter((f) => f.name.includes(folderFilter))


    const fetchFolderGroups = () => {
        const headers = new Headers();

        let token = getToken()
        headers.append("Authorization", token);
        headers.append("Accept", 'application/json');

        const options = {
            method: 'GET',
            headers
        };

        const route = `http://${process.env.REACT_APP_API_URI}/api/v1/orgs/${selectedOrg?._id}/folder_groups`;
        fetch(route, options)
            .then(res => {
                return res.json();
            })
            .then(res => {
                if (res['detail']) {
                    throw (res['detail']);
                }
                // addToast('Список групп папок загружен!', {
                //     appearance: 'success',
                //     autoDismiss: true,
                // });
                setFgs(res);
                const lastFgsId = localStorage.getItem('last_fgs_id');
                const lastFgs = res.find((f: I_FolderGroup) => f._id === lastFgsId)
                if (Boolean(lastFgs)) {
                    fetchFolders(lastFgsId);
                }
            })
            .catch(error => {
                addToast('При загрузке списка групп папок произошла ошибка...', {
                    appearance: 'error',
                    autoDismiss: true,
                });
            });
    };

    useEffect(() => {
        fetchFolderGroups();
    },);

    const handleDrawerClose = () => {
        setSelectedOrg(null);
        setDocuments([]);
        setFolders([]);
        setSelectedFolder(null);
    };

    const deleteFolderClick = (event: any) => {
        event.preventDefault();
        event.stopPropagation();
        setDelFolderDialogOpen(true);
    };

    const changeFolderClick = (event: any) => {
        event.preventDefault();
        event.stopPropagation();
        setChangeFolderDialogOpen(true);
    };

    const onFolderClick = (event: any, folder: I_Folder) => {
        event.preventDefault();
        setSelectedFolder(folder);
    };

    const handleFolderFilterInput = (event: any) => {
        event.preventDefault();
        setFolderFilter(event.target.value)
    };

    const handleFgsChange = (event: React.ChangeEvent<{ value: unknown }>) => {
        setDocuments([]);
        setSelectedFolder(null);
        setSelectedFgsId(event.target.value as string);
        fetchFolders(event.target.value as string);
        localStorage.setItem('last_fgs_id', event.target.value as string)
    };

    return (
        <div className={classes.leftPanel}>
            <div className={classes.leftPanelHeader}>
                <div className={classes.toolbarButtonsDiv}>
                    <Button
                        type="submit"
                        fullWidth
                        className={classes.addFolderButton}
                        variant="contained"
                        color="secondary"
                        onClick={handleDrawerClose}
                    >
                        Выйти
                    </Button>
                    {(selectedOrg?.canWrite.includes(currentUser?._id as string) || currentUser?.isSuper) &&
                    <Button
                        type="submit"
                        fullWidth
                        variant="contained"
                        color="primary"
                        disabled={!Boolean(selectedFgsId)}
                        onClick={() => setAddFolderDialogOpen(true)}
                    >
                        Добавить
                    </Button>
                    }
                </div>
                <Divider/>
                <FormControl className={classes.formControl}>
                    <InputLabel id="select-label">Категория папок</InputLabel>
                    <Select
                        value={selectedFgsId}
                        onChange={handleFgsChange}
                        displayEmpty
                        className={classes.selectEmpty}
                        inputProps={{'aria-label': 'Without label'}}
                    >
                        {fgs.map(f => (
                            <MenuItem key={f._id} value={f._id}>{f.name}</MenuItem>
                        ))
                        }
                    </Select>
                </FormControl>
                <div className={classes.search}>
                    <div className={classes.searchIcon}>
                        <Search/>
                    </div>
                    <InputBase placeholder="Поиск…"
                               classes={{
                                   root: classes.searchInputRoot,
                                   input: classes.searchInputInput,
                               }}
                               inputProps={{'aria-label': 'search'}}
                               onInputCapture={handleFolderFilterInput}
                    />
                </div>
            </div>
            <Drawer
                variant="permanent"
                classes={{
                    paper: classes.drawerPaper,
                }}
                className={classes.drawer}
                open={Boolean(selectedOrg)}
            >
                <List>
                    {filteredFolders.map((folder) => (
                        <ListItem
                            button
                            key={folder._id}
                            onClick={event => onFolderClick(event, folder)}
                            className={
                                folder._id === selectedFolder?._id
                                    ? classes.selectedFolder
                                    : classes.unselectedFolder
                            }
                        >
                            <ListItemIcon>
                                <Folder/>
                            </ListItemIcon>
                            <ListItemText
                                disableTypography
                                primary={<Typography variant="body2">{folder.name}</Typography>}
                            />
                            {folder === selectedFolder && currentUser?.isSuper &&
                            <div>
                                <IconButton aria-label="delete"
                                            size="small"
                                            color='primary'
                                            onClick={event => changeFolderClick(event)}>
                                    <Edit/>
                                </IconButton>
                                <IconButton aria-label="delete"
                                            size="small"
                                            color='secondary'
                                            onClick={event => deleteFolderClick(event)}>
                                    <DeleteIcon/>
                                </IconButton>
                            </div>
                            }
                        </ListItem>
                    ))
                    }
                </List>
                <AddFolderDialog open={addFolderDialogOpen}
                                 setOpen={setAddFolderDialogOpen}
                                 folders={folders}
                                 setFolders={setFolders}
                                 fgsId={selectedFgsId}
                                 setSelectedFolder={setSelectedFolder}
                />
                <EditFolderDialog open={changeFolderDialogOpen}
                                  setOpen={setChangeFolderDialogOpen}
                                  folders={folders}
                                  setFolders={setFolders}
                                  fgsId={selectedFgsId}
                                  setSelectedFolder={setSelectedFolder}
                                  selectedFolder={selectedFolder}/>
                <DeleteFolderDialog open={delFolderDialogOpen}
                                    setOpen={setDelFolderDialogOpen}
                                    folderId={selectedFolder?._id}
                                    folders={folders}
                                    setFolders={setFolders}
                                    setDocuments={setDocuments}
                                    setSelectedFolder={setSelectedFolder}
                />
            </Drawer>
        </div>
    );
}

export default DrawerSideBar;
