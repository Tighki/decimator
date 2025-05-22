import React from 'react';
import {fade, makeStyles, Theme} from '@material-ui/core/styles';
import {
    Button,
    Divider,
    FormControl,
    IconButton,
    InputLabel,
    List,
    ListItemIcon,
    MenuItem,
    Select,
    Typography,
    Tooltip,
    Chip,
    TextField,
    InputAdornment
} from '@material-ui/core';
import Autocomplete, { createFilterOptions } from '@material-ui/lab/Autocomplete';
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
        backgroundColor: '#fff',
        border: `1px solid ${fade(theme.palette.common.black, 0.15)}`,
        '&:hover': {
            backgroundColor: '#fff',
            border: `1px solid ${fade(theme.palette.common.black, 0.25)}`,
        },
        '&.Mui-focused': {
            backgroundColor: '#fff',
            border: `1px solid ${theme.palette.primary.main}`,
            boxShadow: `0 0 0 2px ${fade(theme.palette.primary.main, 0.25)}`,
        },
        width: '90%',
        maxWidth: '225px',
        marginLeft: theme.spacing(1),
        marginRight: theme.spacing(1),
        marginBottom: theme.spacing(1),
        height: '40px',
    },
    searchIcon: {
        color: fade(theme.palette.common.black, 0.5),
        marginRight: 2,
    },
    searchInputRoot: {
        color: 'inherit',
        width: '100%',
        height: '100%',
    },
    searchInputInput: {
        padding: theme.spacing(1, 1, 1, 0),
        paddingLeft: `calc(1em + ${theme.spacing(3)}px)`,
        transition: theme.transitions.create('width'),
        width: '100%',
        height: '100%',
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
        minHeight: 'auto',
        paddingBottom: theme.spacing(1),
        overflow: 'visible',
        zIndex: 10
    },
    formControl: {
        width: '90%',
        maxWidth: '225px',
        marginTop: theme.spacing(0.5),
        marginBottom: theme.spacing(1),
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
        marginTop: theme.spacing(1.5),
    },
    clearButton: {
        marginLeft: theme.spacing(1),
        padding: 4,
    },
    filtersContainer: {
        paddingTop: theme.spacing(1),
        paddingBottom: theme.spacing(1),
        backgroundColor: theme.palette.background.paper,
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        position: 'relative',
        zIndex: 20,
    },
    foldersContainer: {
        overflowY: 'auto',
        flex: 1,
        marginTop: theme.spacing(0.5),
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
    projectLabel: {
        fontWeight: 500,
        marginLeft: theme.spacing(1),
        marginTop: theme.spacing(1.5),
        marginBottom: theme.spacing(0.5),
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    projectChip: {
        margin: theme.spacing(0.3),
        maxWidth: '100%',
        height: '24px',
    },
    projectsContainer: {
        display: 'flex',
        flexWrap: 'wrap',
        padding: theme.spacing(0.3, 1),
        maxHeight: '60px',
        overflowY: 'auto',
        border: `1px solid ${theme.palette.divider}`,
        borderRadius: theme.shape.borderRadius,
        marginLeft: theme.spacing(1),
        marginRight: theme.spacing(1),
        marginBottom: theme.spacing(0.5),
        backgroundColor: fade(theme.palette.common.black, 0.02),
    },
    projectSelectMenu: {
        maxHeight: '300px',
    },
    selectFormControl: {
        marginTop: 0,
    },
    selectPlaceholder: {
        fontStyle: 'normal',
        fontWeight: 'normal',
    },
    projectAutocomplete: {
        width: '90%',
        maxWidth: '225px',
        marginLeft: theme.spacing(1),
        marginRight: theme.spacing(1),
        marginBottom: theme.spacing(1.5),
        '& .MuiOutlinedInput-root': {
            backgroundColor: '#fff',
            height: '40px',
            '&:hover': {
                backgroundColor: '#fff',
            },
            '& fieldset': {
                borderColor: fade(theme.palette.common.black, 0.15),
            },
            '&:hover fieldset': {
                borderColor: fade(theme.palette.common.black, 0.25),
            },
            '&.Mui-focused fieldset': {
                borderColor: theme.palette.primary.main,
            },
        },
    },
    folderSearch: {
        width: '90%',
        maxWidth: '225px',
        marginLeft: theme.spacing(1),
        marginRight: theme.spacing(1),
        marginBottom: theme.spacing(1),
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
                           fetchFolders: initialFetchFolders,
                           selectedFgsId,
                           setSelectedFgsId,
                           setFolders,
                           folders
                       }: SideBarProp) => {
    const classes = useStyles();
    const {addToast} = useToasts();
    const filter = createFilterOptions<string>();

    const [fgs, setFgs] = React.useState<I_FolderGroup[]>([]);
    const [folderFilter, setFolderFilter] = React.useState<string>('');
    const [projectFilter, setProjectFilter] = React.useState<string[]>([]);
    const [projects, setProjects] = React.useState<string[]>([]);
    const [foldersWithProjects, setFoldersWithProjects] = React.useState<Map<string, string[]>>(new Map());
    const [addFolderDialogOpen, setAddFolderDialogOpen] = React.useState<boolean>(false);
    const [delFolderDialogOpen, setDelFolderDialogOpen] = React.useState<boolean>(false);
    const [changeFolderDialogOpen, setChangeFolderDialogOpen] = React.useState<boolean>(false);
    const [isLoading, setIsLoading] = React.useState<boolean>(false);
    
    // Создаем useRef для хранения функции fetchFolders
    const fetchFoldersRef = React.useRef(initialFetchFolders);

    // Функция фильтрации папок с учетом как имени папки, так и проектов в ней
    const getFilteredFolders = () => {
        // Сначала фильтруем по имени папки
        let result = folders.filter((f) => f.name.toLowerCase().includes(folderFilter.toLowerCase()));
        
        // Если есть фильтр по проекту, дополнительно фильтруем по проектам
        if (projectFilter.length > 0) {
            result = result.filter((folder) => {
                const folderProjects = foldersWithProjects.get(folder._id) || [];
                return projectFilter.some(selectedProject => 
                    folderProjects.some(folderProject => 
                        folderProject.toLowerCase().includes(selectedProject.toLowerCase())
                    )
                );
            });
        }
        
        return result;
    };
    
    const filteredFolders = getFilteredFolders();

    // Добавляем локальное кэширование данных по категориям папок
    const folderGroupsCache = React.useRef<{[key: string]: I_Folder[]}>({});

    // Функция для загрузки списка проектов и обновления фильтра папок
    const fetchProjects = React.useCallback(async (folder: I_Folder | null) => {
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
            
            if (!response.ok) {
                throw new Error(`Ошибка HTTP: ${response.status}`);
            }
            
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
    React.useEffect(() => {
        if (selectedFolder) {
            fetchProjects(selectedFolder);
        }
    }, [selectedFolder, fetchProjects]);

    // Загружаем проекты при изменении списка папок - начальная загрузка
    const fetchAllProjects = React.useCallback(async () => {
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
                
                if (!response.ok) {
                    throw new Error(`Ошибка HTTP: ${response.status}`);
                }
                
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
    React.useEffect(() => {
        if (folders.length > 0) {
            fetchAllProjects();
        }
    }, [folders, fetchAllProjects]);

    const fetchFolderGroups = React.useCallback(() => {
        // Предотвращаем запрос если нет выбранной организации
        if (!selectedOrg?._id) {
            return;
        }

        const headers = new Headers();
        let token = getToken()
        headers.append("Authorization", token);
        headers.append("Accept", 'application/json');

        const options = {
            method: 'GET',
            headers
        };

        const route = `http://${process.env.REACT_APP_API_URI}/api/v1/orgs/${selectedOrg._id}/folder_groups`;
        fetch(route, options)
            .then(res => {
                if (!res.ok) {
                    throw new Error(`Ошибка HTTP: ${res.status}`);
                }
                return res.json();
            })
            .then(res => {
                if (res['detail']) {
                    throw (res['detail']);
                }
                setFgs(res);
                const lastFgsId = localStorage.getItem('last_fgs_id');
                const lastFgs = res.find((f: I_FolderGroup) => f._id === lastFgsId)
                if (Boolean(lastFgs)) {
                    fetchFoldersRef.current(lastFgsId);
                } else if (res.length > 0) {
                    // Если нет сохраненной группы, но есть группы папок - выбираем первую
                    localStorage.setItem('last_fgs_id', res[0]._id);
                    fetchFoldersRef.current(res[0]._id);
                }
            })
            .catch(error => {
                console.error('Ошибка загрузки групп папок:', error);
                addToast('При загрузке списка групп папок произошла ошибка...', {
                    appearance: 'error',
                    autoDismiss: true,
                });
            });
    }, [selectedOrg, addToast]);

    // Оптимизированная функция загрузки папок с кэшированием
    const fetchFoldersOptimized = React.useCallback((fgsId: string) => {
        // Проверяем кэш перед запросом
        if (folderGroupsCache.current[fgsId]) {
            console.log(`Используем кэшированные папки для группы ${fgsId}`);
            setFolders(folderGroupsCache.current[fgsId]);
            return;
        }

        // Если нет в кэше, делаем запрос
        const headers = new Headers();
        let token = getToken()
        headers.append("Authorization", token);
        headers.append("Accept", "application/json");

        const options = {
            method: 'GET',
            headers
        };

        const route = `http://${process.env.REACT_APP_API_URI}/api/v1/folders/${fgsId}`;
        
        // Показываем пользователю, что идет загрузка
        setFolders([]);
        setIsLoading(true);
        
        fetch(route, options)
            .then(res => {
                if (!res.ok) {
                    throw new Error(`Ошибка HTTP: ${res.status}`);
                }
                return res.json();
            })
            .then(folders => {
                if (Array.isArray(folders)) {
                    // Сохраняем в кэш
                    folderGroupsCache.current[fgsId] = folders;
                    setFolders(folders);
                }
            })
            .catch(error => {
                console.error('Ошибка загрузки папок:', error);
                addToast('При загрузке списка папок произошла ошибка', {
                    appearance: 'error',
                    autoDismiss: true,
                });
            })
            .finally(() => {
                setIsLoading(false);
            });
    }, [addToast, setFolders]);
    
    // Устанавливаем fetchFoldersOptimized в fetchFoldersRef при первой загрузке компонента
    React.useEffect(() => {
        fetchFoldersRef.current = fetchFoldersOptimized;
    }, [fetchFoldersOptimized]);

    React.useEffect(() => {
        if (selectedOrg?._id) {
            fetchFolderGroups();
        }
    }, [selectedOrg, fetchFolderGroups]);

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
        fetchFoldersRef.current(event.target.value as string);
        localStorage.setItem('last_fgs_id', event.target.value as string)
    };

    const handleProjectChange = (_event: React.ChangeEvent<{}>, newValue: string[]) => {
        setProjectFilter(newValue);
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
                    
                    <div className={classes.projectLabel}>
                        <Typography variant="body2" style={{ fontWeight: 500 }}>Фильтр проектов</Typography>
                        {projectFilter.length > 0 && (
                            <Tooltip title="Сбросить проекты">
                                <IconButton 
                                    size="small" 
                                    className={classes.clearButton}
                                    onClick={() => setProjectFilter([])}
                                >
                                    <Clear fontSize="small" />
                                </IconButton>
                            </Tooltip>
                        )}
                    </div>
                    
                    <Autocomplete
                        multiple
                        freeSolo
                        id="project-filter-autocomplete"
                        options={projects}
                        value={projectFilter}
                        onChange={handleProjectChange}
                        className={classes.projectAutocomplete}
                        filterOptions={(options, params) => {
                            const filtered = filter(options, params);
                            
                            // Добавляем введенный пользователем вариант, если его нет в списке
                            const { inputValue } = params;
                            const isExisting = options.some(option => inputValue === option);
                            
                            if (inputValue !== '' && !isExisting) {
                                filtered.push(inputValue);
                            }
                            
                            return filtered;
                        }}
                        renderTags={(value, getTagProps) =>
                            value.map((option, index) => (
                                <Chip 
                                    variant="outlined"
                                    label={option}
                                    size="small"
                                    {...getTagProps({ index })}
                                    className={classes.projectChip}
                                />
                            ))
                        }
                        renderInput={(params) => (
                            <TextField
                                {...params}
                                variant="outlined"
                                placeholder={projectFilter.length > 0 ? '' : "Выберите или введите проект"}
                                size="small"
                            />
                        )}
                    />
                    
                    <div className={classes.searchContainer}>
                        <TextField
                            className={classes.folderSearch}
                            variant="outlined"
                            placeholder="Поиск папок..."
                            size="small"
                            value={folderFilter}
                            onChange={handleFolderFilterInput}
                            InputProps={{
                                startAdornment: (
                                    <InputAdornment position="start">
                                        <Search className={classes.searchIcon} />
                                    </InputAdornment>
                                ),
                                endAdornment: folderFilter ? (
                                    <InputAdornment position="end">
                                        <IconButton
                                            aria-label="clear search"
                                            onClick={() => setFolderFilter('')}
                                            size="small"
                                            className={classes.clearButton}
                                        >
                                            <Clear fontSize="small" />
                                        </IconButton>
                                    </InputAdornment>
                                ) : null
                            }}
                        />
                    </div>
                </div>
            </div>
            <div className={classes.foldersContainer}>
                <Typography variant="subtitle1" style={{ padding: '8px 16px', fontWeight: 'bold' }}>
                    Папки ({filteredFolders.length})
                </Typography>
                {isLoading ? (
                    <div style={{ display: 'flex', justifyContent: 'center', padding: '24px' }}>
                        <Typography variant="body2" color="textSecondary">
                            Загрузка папок...
                        </Typography>
                    </div>
                ) : filteredFolders.length > 0 ? (
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
                        ))}
                    </List>
                ) : (
                    <div style={{ display: 'flex', justifyContent: 'center', padding: '24px' }}>
                        <Typography variant="body2" color="textSecondary">
                            Папки не найдены
                        </Typography>
                    </div>
                )}
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