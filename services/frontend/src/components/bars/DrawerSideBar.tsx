import React, {useCallback, useEffect} from 'react';
import {fade, makeStyles, Theme} from '@material-ui/core/styles';
import {
    Button,
    Divider,
    FormControl,
    IconButton,
    InputBase,
    InputLabel,
    List,
    ListItemIcon,
    MenuItem,
    Select,
    Typography,
    Tooltip
} from '@material-ui/core';
import ListItem from "@material-ui/core/ListItem";
import ListItemText from "@material-ui/core/ListItemText";
import DeleteIcon from "@material-ui/icons/Delete";
import {
    Edit,
    Folder,
    Search,
    Clear
} from "@material-ui/icons";
import {useToasts} from "react-toast-notifications";
import {I_FolderGroup, I_Organization} from "../../types/org";
import {getToken} from "../../utils/auth";
import {I_Folder} from "../../types/folder";
import {I_CurrentUser} from "../../types/user";
import AddFolderDialog from "../org/dialogs/AddFolderDialog";
import DeleteFolderDialog from "../org/dialogs/DeleteFolderDialog";
import EditFolderDialog from "../org/dialogs/EditFolderDialog";
import {I_Document} from "../../types/document";


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
        marginBottom: theme.spacing(1),
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
            backgroundColor: "steelblue",
            color: "white"
        }
    },
    unselectedFolder: {
        "&:hover": {
            backgroundColor: "#f5f5f5"
        }
    },
    leftPanel: {
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        width: '270px',
        boxShadow: theme.shadows[1],
    },
    leftPanelHeader: {
        minHeight: '250px',
        paddingBottom: theme.spacing(2),
        overflow: 'visible',
        zIndex: 10
    },
    formControl: {
        // padding: theme.spacing(1),
        width: '90%',
        maxWidth: '225px',
        marginTop: theme.spacing(1),
        marginBottom: theme.spacing(2),
        marginLeft: theme.spacing(1),
        marginRight: theme.spacing(1),
    },
    selectEmpty: {
        // marginTop: theme.spacing(2),
    },
    searchContainer: {
        display: 'flex',
        width: '100%',
        alignItems: 'center',
        marginBottom: theme.spacing(1),
    },
    clearButton: {
        marginLeft: theme.spacing(1),
    },
    filtersContainer: {
        paddingTop: theme.spacing(1),
        paddingBottom: theme.spacing(1),
        backgroundColor: theme.palette.background.paper,
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        position: 'relative',
        zIndex: 20,
    },
    projectLabel: {
        fontWeight: 500,
        marginLeft: theme.spacing(1),
        marginTop: theme.spacing(1),
        marginBottom: theme.spacing(0.5),
    },
    foldersContainer: {
        overflowY: 'auto',
        height: 'calc(100% - 270px)',
        marginTop: theme.spacing(1),
    },
    folderList: {
        paddingTop: 0,
        paddingBottom: 0,
    },
    folderItemText: {
        marginLeft: theme.spacing(-1),
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
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
    const [projectFilter, setProjectFilter] = React.useState<string>('');
    const [projects, setProjects] = React.useState<string[]>([]);
    const [foldersWithProjects, setFoldersWithProjects] = React.useState<Map<string, string[]>>(new Map());
    const [addFolderDialogOpen, setAddFolderDialogOpen] = React.useState<boolean>(false);
    const [delFolderDialogOpen, setDelFolderDialogOpen] = React.useState<boolean>(false);
    const [changeFolderDialogOpen, setChangeFolderDialogOpen] = React.useState<boolean>(false);

    // Функция фильтрации папок с учетом как имени папки, так и проектов в ней
    const getFilteredFolders = () => {
        // Сначала фильтруем по имени папки
        let result = folders.filter((f) => f.name.toLowerCase().includes(folderFilter.toLowerCase()));
        
        // Если есть фильтр по проекту, дополнительно фильтруем по проектам
        if (projectFilter) {
            result = result.filter((folder) => {
                const folderProjects = foldersWithProjects.get(folder._id) || [];
                return folderProjects.some(project => 
                    project.toLowerCase().includes(projectFilter.toLowerCase())
                );
            });
        }
        
        return result;
    };
    
    const filteredFolders = getFilteredFolders();

    // Функция для загрузки списка проектов и обновления фильтра папок
    const fetchProjects = useCallback(async (folder: I_Folder | null) => {
        if (!folder || !selectedOrg) return;
        
        const headers = new Headers();
        let token = getToken()
        headers.append("Authorization", token);
        headers.append("Accept", "application/json");
        
        const options = {
            method: 'GET',
            headers
        };
        
        try {
            const route = `http://${process.env.REACT_APP_API_URI}/api/v1/documents/?folder_id=${folder._id}`;
            const response = await fetch(route, options);
            const documents: I_Document[] = await response.json();
            
            if (Array.isArray(documents)) {
                const folderProjects = documents
                    .map(doc => doc.project)
                    .filter(project => project && project.trim() !== '');
                
                // Обновляем проекты для данной папки
                const uniqueProjects = Array.from(new Set(folderProjects));
                const newFoldersWithProjects = new Map(foldersWithProjects);
                newFoldersWithProjects.set(folder._id, uniqueProjects);
                setFoldersWithProjects(newFoldersWithProjects);
                
                // Обновляем общий список проектов
                const allProjectsSet = new Set(projects);
                folderProjects.forEach(project => allProjectsSet.add(project));
                setProjects(Array.from(allProjectsSet).sort());
            }
        } catch (error) {
            console.error(`Ошибка при загрузке документов для папки ${folder.name}:`, error);
        }
    }, [selectedOrg, projects, foldersWithProjects]);

    // Загружаем проекты при выборе новой папки
    useEffect(() => {
        if (selectedFolder) {
            fetchProjects(selectedFolder);
        }
    }, [selectedFolder, fetchProjects]);

    // Загружаем проекты при изменении списка папок - начальная загрузка
    const fetchAllProjects = useCallback(async () => {
        if (!selectedOrg || folders.length === 0) return;
        
        const headers = new Headers();
        let token = getToken()
        headers.append("Authorization", token);
        headers.append("Accept", "application/json");
        
        const options = {
            method: 'GET',
            headers
        };
        
        // Создаем новую карту проектов
        const folderProjectsMap = new Map<string, string[]>();
        const allProjects = new Set<string>();
        
        // Загружаем проекты только для первых 5 папок, чтобы не перегружать сервер
        const foldersToLoad = folders.slice(0, 5);
        
        for (const folder of foldersToLoad) {
            try {
                const route = `http://${process.env.REACT_APP_API_URI}/api/v1/documents/?folder_id=${folder._id}`;
                const response = await fetch(route, options);
                const documents: I_Document[] = await response.json();
                
                if (Array.isArray(documents)) {
                    const folderProjects = documents
                        .map(doc => doc.project)
                        .filter(project => project && project.trim() !== '');
                    
                    // Добавляем проекты в общий список
                    folderProjects.forEach(project => allProjects.add(project));
                    
                    // Сохраняем список проектов для этой папки
                    folderProjectsMap.set(folder._id, Array.from(new Set(folderProjects)));
                }
            } catch (error) {
                console.error(`Ошибка при загрузке документов для папки ${folder.name}:`, error);
            }
        }
        
        setProjects(Array.from(allProjects).sort());
        setFoldersWithProjects(folderProjectsMap);
    }, [selectedOrg, folders]);

    // Обновляем список проектов при изменении списка папок
    useEffect(() => {
        if (folders.length > 0) {
            fetchAllProjects();
        }
    }, [folders, fetchAllProjects]);

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

    const handleFolderFilterInput = (event: React.ChangeEvent<HTMLInputElement>) => {
        setFolderFilter(event.target.value);
    };

    const handleFgsChange = (event: React.ChangeEvent<{ value: unknown }>) => {
        setDocuments([]);
        setSelectedFolder(null);
        setSelectedFgsId(event.target.value as string);
        fetchFolders(event.target.value as string);
        localStorage.setItem('last_fgs_id', event.target.value as string)
    };

    const handleClearFilters = () => {
        setFolderFilter('');
        setProjectFilter('');
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
                <div className={classes.filtersContainer}>
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
                    
                    <Typography className={classes.projectLabel}>Фильтр проектов</Typography>
                    <FormControl className={classes.formControl}>
                        <InputLabel id="project-select-label" shrink>Проект</InputLabel>
                        <Select
                            value={projectFilter}
                            onChange={(event) => setProjectFilter(event.target.value as string)}
                            displayEmpty
                            className={classes.selectEmpty}
                            inputProps={{'aria-label': 'Without label'}}
                        >
                            <MenuItem value="">Все проекты</MenuItem>
                            {projects.map(project => (
                                <MenuItem key={project} value={project}>{project}</MenuItem>
                            ))}
                        </Select>
                    </FormControl>
                    
                    <div className={classes.searchContainer}>
                        <div className={classes.search}>
                            <div className={classes.searchIcon}>
                                <Search/>
                            </div>
                            <InputBase placeholder="Поиск папок…"
                                    value={folderFilter}
                                    classes={{
                                        root: classes.searchInputRoot,
                                        input: classes.searchInputInput,
                                    }}
                                    inputProps={{'aria-label': 'search'}}
                                    onChange={handleFolderFilterInput}
                            />
                        </div>
                        {(folderFilter || projectFilter) && (
                            <Tooltip title="Сбросить фильтры">
                                <IconButton 
                                    size="small" 
                                    className={classes.clearButton}
                                    onClick={handleClearFilters}
                                >
                                    <Clear />
                                </IconButton>
                            </Tooltip>
                        )}
                    </div>
                </div>
            </div>
            <div className={classes.foldersContainer}>
                <Typography variant="subtitle1" style={{ padding: '8px 16px', fontWeight: 'bold' }}>
                    Папки ({filteredFolders.length})
                </Typography>
                <List className={classes.folderList}>
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
                                <Folder fontSize="small"/>
                            </ListItemIcon>
                            <ListItemText
                                disableTypography
                                className={classes.folderItemText}
                                primary={<Typography variant="body2" noWrap>{folder.name}</Typography>}
                            />
                            {folder === selectedFolder && currentUser?.isSuper &&
                            <div>
                                <IconButton aria-label="edit"
                                            size="small"
                                            color='primary'
                                            onClick={event => changeFolderClick(event)}>
                                    <Edit fontSize="small"/>
                                </IconButton>
                                <IconButton aria-label="delete"
                                            size="small"
                                            color='secondary'
                                            onClick={event => deleteFolderClick(event)}>
                                    <DeleteIcon fontSize="small"/>
                                </IconButton>
                            </div>
                            }
                        </ListItem>
                    ))
                    }
                </List>
            </div>
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
        </div>
    );
}

export default DrawerSideBar;
