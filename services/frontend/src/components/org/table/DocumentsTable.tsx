import * as React from 'react';
// @ts-ignore
import {ColDef, DataGrid, ValueGetterParams, GridPageChangeParams, GridSortModelParams} from '@material-ui/data-grid';
import {Typography, TextField, MenuItem, FormControl, InputLabel, Select, Paper, InputAdornment, IconButton, Button, Chip} from "@material-ui/core";
import {makeStyles} from "@material-ui/core/styles";
import EditIcon from "@material-ui/icons/Edit";
import DeleteIcon from "@material-ui/icons/Delete";
import {I_Document} from "../../../types/document";
import AddDocumentDialog from '../dialogs/AddDocumentDialog';
import {I_Folder} from "../../../types/folder";
import {I_CurrentUser} from "../../../types/user";
import DeleteDocDialog from '../dialogs/DeleteDocDialog';
import ReserveAlbumDialog from '../dialogs/ReserveAlbumDialog';
import {Info, Lock, KeyboardArrowLeft, KeyboardArrowRight, FirstPage, LastPage, Search as SearchIcon, FilterList as FilterIcon} from "@material-ui/icons";
import {I_Organization} from "../../../types/org";
import EditDocumentDialog from '../dialogs/EditDocumentDialog';
import DocumentInfoDialog from '../dialogs/DocumentInfoDialog';

export const capitalizeFirstLetter = (str: string) => {
    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}

const useStyles = makeStyles((theme) => ({
    outerContainer: {
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        margin: 0,
        padding: 0
    },
    container: {
        height: '90%',
        width: '100%',
        margin: 0,
        padding: 0
    },
    button: {
        marginBottom: theme.spacing(2),
        marginRight: theme.spacing(4),
    },
    buttonsDiv: {
        display: 'flex',
        margin: 0,
        padding: 0
    },
    backdrop: {
        zIndex: theme.zIndex.drawer + 1,
        color: '#fff',
    },
    addButton: {
        display: 'flex',
        width: '30%',
        margin: 0,
        padding: 0
    },
    reserveButton: {
        display: 'flex',
        width: '20%',
        flexDirection: 'row-reverse',
        margin: 0,
        padding: 0
    },
    reserveChips: {
        display: 'flex',
        width: '90%',
        height: '100%',
        padding: '5px',
        alignItems: 'center'
    },
    chip: {
        marginRight: '7px'
    },
    paginationContainer: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'flex-end',
        position: 'absolute',
        bottom: 15,
        right: 15,
        zIndex: 10,
        backgroundColor: 'rgba(255, 255, 255, 0.9)',
        padding: '0 8px'
    },
    paginationText: {
        margin: '0 10px'
    },
    dataGridContainer: {
        width: '100%',
        height: '100%',
        position: 'relative',
        marginBottom: theme.spacing(5)
    },
    filterContainer: {
        display: 'flex',
        alignItems: 'center',
        marginBottom: theme.spacing(2),
        padding: theme.spacing(2),
        backgroundColor: theme.palette.background.paper,
    },
    filterField: {
        marginRight: theme.spacing(2),
        minWidth: 150,
    },
    searchField: {
        marginRight: theme.spacing(2),
        width: 300,
    },
    filterTitle: {
        marginRight: theme.spacing(2),
        fontWeight: 500,
    },
    hideSort: {
        '& .MuiDataGrid-iconButtonContainer, & .MuiDataGrid-sortIcon': {
            display: 'none !important'
        },
        '& .MuiDataGrid-columnHeaderTitleContainer': {
            padding: 0
        }
    },
    hideSortIcons: {
        '& .MuiDataGrid-columnHeaderSortable': {
            cursor: 'pointer',
        },
        '& .MuiDataGrid-columnHeaderSortable .MuiDataGrid-columnHeaderTitleContainer': {
            justifyContent: 'flex-start',
        },
        '& .MuiDataGrid-sortIcon': {
            display: 'none !important'
        },
        '& .MuiDataGrid-columnHeader:focus': {
            outline: 'none',
        },
        '& .MuiDataGrid-columnHeader:focus-within': {
            outline: 'none',
        }
    }
}));

type TableProp = {
    documents: I_Document[]
    setDocuments: Function
    selectedOrg: I_Organization | null
    selectedFolder: I_Folder | null
    reFetchFolders: Function
    setSelectedFolder: Function
    currentUser: I_CurrentUser | null
}

const DocumentsTable = ({
                            documents,
                            selectedFolder,
                            currentUser,
                            setDocuments,
                            reFetchFolders,
                            setSelectedFolder,
                            selectedOrg
                        }: TableProp) => {
    const classes = useStyles();
    const [openAddDialog, setOpenAddDialog] = React.useState<boolean>(false);
    const [openEditDialog, setOpenEditDialog] = React.useState<boolean>(false);
    const [openInfoDialog, setOpenInfoDialog] = React.useState<boolean>(false);
    const [openReserveDialog, setOpenReserveDialog] = React.useState<boolean>(false);
    const [openDeleteDialog, setOpenDeleteDialog] = React.useState<boolean>(false);
    const [docToDeleteId, setDocToDeleteId] = React.useState<any>('');
    const [selectedDoc, setSelectedDoc] = React.useState<I_Document | null>(null);
    const [page, setPage] = React.useState(0);
    const pageSize = 13;

    const [filterField, setFilterField] = React.useState<string>('all');
    const [searchText, setSearchText] = React.useState<string>('');
    const [filteredDocuments, setFilteredDocuments] = React.useState<I_Document[]>(documents);
    const [sortModel, setSortModel] = React.useState<any>([]);

    const handleFilterFieldChange = (event: React.ChangeEvent<{ value: unknown }>) => {
        setFilterField(event.target.value as string);
    };

    const handleSearchTextChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        setSearchText(event.target.value);
    };

    const clearFilter = () => {
        setSearchText('');
        setFilterField('all');
    };

    const filterDocuments = React.useCallback(() => {
        if (!searchText.trim()) {
            setFilteredDocuments(documents);
            setPage(0);
            return;
        }

        const lowercaseSearchText = searchText.toLowerCase();
        
        const filtered = documents.filter(doc => {

            if (filterField === 'all') {

                const number = ('00' + doc.number).slice(-3);
                if (number.includes(lowercaseSearchText)) return true;

                if (doc.version && doc.version.toLowerCase().includes(lowercaseSearchText)) return true;
                
                const authorFullName = doc.authorFullName;
                const authorDisplayName = `${authorFullName.lastName} ${authorFullName.firstName.charAt(0)}. ${authorFullName.secondName.charAt(0)}.`.toLowerCase();
                if (authorDisplayName.includes(lowercaseSearchText)) return true;

                const date = new Date(doc.created);
                const formattedDate = `${('0' + date.getDate()).slice(-2)}.${('0' + (date.getMonth() + 1)).slice(-2)}.${date.getFullYear()}`;
                if (formattedDate.includes(lowercaseSearchText)) return true;
                
                if (doc.project && doc.project.toLowerCase().includes(lowercaseSearchText)) return true;
                
                if (doc.comment && doc.comment.toLowerCase().includes(lowercaseSearchText)) return true;
                
                return false;
            } else {

                switch (filterField) {
                    case 'number':
                        const number = ('00' + doc.number).slice(-3);
                        return number.includes(lowercaseSearchText);
                    case 'version':
                        return doc.version && doc.version.toLowerCase().includes(lowercaseSearchText);
                    case 'author':
                        const authorFullName = doc.authorFullName;
                        const authorDisplayName = `${authorFullName.lastName} ${authorFullName.firstName.charAt(0)}. ${authorFullName.secondName.charAt(0)}.`.toLowerCase();
                        return authorDisplayName.includes(lowercaseSearchText);
                    case 'date':
                        const date = new Date(doc.created);
                        const formattedDate = `${('0' + date.getDate()).slice(-2)}.${('0' + (date.getMonth() + 1)).slice(-2)}.${date.getFullYear()}`;
                        return formattedDate.includes(lowercaseSearchText);
                    case 'project':
                        return doc.project && doc.project.toLowerCase().includes(lowercaseSearchText);
                    case 'comment':
                        return doc.comment && doc.comment.toLowerCase().includes(lowercaseSearchText);
                    default:
                        return false;
                }
            }
        });
        
        setFilteredDocuments(filtered);
        setPage(0);
    }, [documents, filterField, searchText]);

    React.useEffect(() => {
        filterDocuments();
    }, [documents, filterField, searchText, filterDocuments]);

    const onAddNewClick = (event: any) => {
        event.preventDefault();
        setOpenAddDialog(true)
    };

    const onAddReserveClick = (event: any) => {
        event.preventDefault();
        setOpenReserveDialog(true)
    };

    const handlePageChange = (params: GridPageChangeParams) => {
        setPage(params.page);
    };

    const handleFirstPage = () => {
        setPage(0);
    };

    const handlePrevPage = () => {
        if (page > 0) {
            setPage(page - 1);
        }
    };

    const handleNextPage = () => {
        const maxPage = Math.ceil(filteredDocuments.length / pageSize) - 1;
        if (page < maxPage) {
            setPage(page + 1);
        }
    };

    const handleLastPage = () => {
        const maxPage = Math.ceil(filteredDocuments.length / pageSize) - 1;
        setPage(maxPage);
    };

    // Обработчик изменения сортировки
    const handleSortModelChange = (params: GridSortModelParams) => {
        setSortModel(params.sortModel);
    };

    const columns: ColDef[] = [
        {
            field: 'order_number',
            headerName: 'Номер',
            sortable: true,
            width: 100,
            disableColumnMenu: true,
            valueGetter: (params: ValueGetterParams) => {
                let num: any = params.getValue('number');
                return `${('00' + num).slice(-3)}`
            },
            sortComparator: (v1, v2, param1, param2) => {
                const num1 = param1.getValue('number') as number;
                const num2 = param2.getValue('number') as number;
                return num1 - num2;
            }
        },
        {
            field: 'version',
            headerName: 'Исполнение',
            sortable: false,
            width: 150,
            disableColumnMenu: true,
        },
        {
            field: 'fullName',
            headerName: 'Автор',
            sortable: true,
            width: 180,
            disableColumnMenu: true,
            valueGetter: (params: ValueGetterParams) => {
                const data: any = params.getValue('authorFullName');
                const fn = capitalizeFirstLetter(data.firstName).charAt(0);
                const sn = capitalizeFirstLetter(data.secondName).charAt(0);
                const ln = capitalizeFirstLetter(data.lastName);
                return `${ln} ${fn}. ${sn}.`
            },
            sortComparator: (v1, v2, param1, param2) => {
                const author1 = param1.getValue('authorFullName') as any;
                const author2 = param2.getValue('authorFullName') as any;
                return author1.lastName.localeCompare(author2.lastName, 'ru');
            }
        },
        {
            field: 'date',
            headerName: 'Дата',
            sortable: true,
            width: 150,
            disableColumnMenu: true,
            valueGetter: (params: ValueGetterParams) => {
                const date_str: any = params.getValue('created');
                let date = Date.parse(date_str);
                let new_date = new Date(date)
                let day = new_date.getDate();
                let month = new_date.getMonth();
                let year = new_date.getFullYear();
                return ('0' + day).slice(-2) + '.' + ('0' + (month + 1)).slice(-2) + '.' + year
            },
            sortComparator: (v1, v2, param1, param2) => {
                const date1 = param1.getValue('created') as string;
                const date2 = param2.getValue('created') as string;
                return new Date(date1).getTime() - new Date(date2).getTime();
            }
        },
        {
            field: 'project', 
            headerName: 'Проект', 
            width: 300, 
            disableColumnMenu: true
        },
        {
            field: 'comment', 
            headerName: 'Комментарий', 
            width: 550, 
            sortable: true,
            disableColumnMenu: true,
            sortComparator: (v1, v2) => {
                if (!v1 || !v2) return 0;
                return v1.toString().localeCompare(v2.toString(), 'ru');
            }
        },
        {
            field: 'actions', 
            headerName: 'Действия', 
            width: 130,
            disableColumnMenu: true,
            sortable: false,
            renderCell: (params: ValueGetterParams) => (
                <div style={{width: '100%', display: 'flex', justifyContent: 'space-between'}}>
                    <IconButton aria-label="delete"
                                size="small"
                                color="default"
                                onClick={() => {
                                    setOpenInfoDialog(true);
                                    setSelectedDoc(params.row as unknown as I_Document);
                                }}
                    >
                        <Info/>
                    </IconButton>
                    {(currentUser?.isSuper || ((params.getValue('authorId') === currentUser?._id) &&
                        selectedOrg?.canWrite.includes(currentUser?._id as string)
                    )) &&
                    <div>
                        <IconButton aria-label="delete"
                                    size="small"
                                    color="primary"
                                    onClick={() => {
                                        setOpenEditDialog(true);
                                        setSelectedDoc(params.row as unknown as I_Document);
                                    }}
                        >
                            <EditIcon/>
                        </IconButton>
                        <IconButton aria-label="delete"
                                    size="small"
                                    color='secondary'
                                    onClick={() => {
                                        setOpenDeleteDialog(true);
                                        setDocToDeleteId(params.getValue('id'));
                                    }}
                        >
                            <DeleteIcon/>
                        </IconButton>
                    </div>
                    }
                </div>
            ),
        },
    ]

    // Расчет информации о пагинации
    const startIndex = page * pageSize + 1;
    const endIndex = Math.min((page + 1) * pageSize, filteredDocuments.length);
    const total = filteredDocuments.length;
    const maxPage = Math.ceil(filteredDocuments.length / pageSize) - 1;

    const paginationComponent = (
        <div className={classes.paginationContainer}>
            <Typography variant="body2" className={classes.paginationText}>
                {startIndex}-{endIndex} of {total}
            </Typography>
            <IconButton 
                size="small" 
                onClick={handleFirstPage}
                disabled={page === 0}
            >
                <FirstPage />
            </IconButton>
            <IconButton 
                size="small" 
                onClick={handlePrevPage}
                disabled={page === 0}
            >
                <KeyboardArrowLeft />
            </IconButton>
            <IconButton 
                size="small" 
                onClick={handleNextPage}
                disabled={page === maxPage}
            >
                <KeyboardArrowRight />
            </IconButton>
            <IconButton 
                size="small" 
                onClick={handleLastPage}
                disabled={page === maxPage}
            >
                <LastPage />
            </IconButton>
        </div>
    );

    // @ts-ignore
    return (
        <div className={classes.container}>
            <div className={classes.buttonsDiv}>
                {(selectedOrg?.canWrite.includes(currentUser?._id as string) || currentUser?.isSuper) &&
                <div className={classes.addButton}>
                    <Button fullWidth variant="contained" color="primary" className={classes.button} onClick={onAddNewClick}>
                        Новая запись
                    </Button>
                </div>
                }
                <div className={classes.reserveChips}>
                    {selectedFolder?.reserves.map((reserve) => (
                        <Chip icon={<Lock/>}
                              className={classes.chip}
                              key={reserve.id}
                              size='small'
                              color='secondary'
                              label={`${reserve.from_}  -  ${reserve.to_}`}
                              title={reserve.description}
                        />
                    ))
                    }
                </div>
                <div className={classes.reserveButton}>
                    <Button variant="contained" color="secondary" className={classes.button}
                            onClick={onAddReserveClick}>
                        Резерв
                    </Button>
                </div>
            </div>
            
            {/* Компонент фильтрации */}
            <Paper className={classes.filterContainer}>
                <Typography variant="body1" className={classes.filterTitle}>
                    <FilterIcon fontSize="small" style={{ verticalAlign: 'middle', marginRight: 8 }} />
                    Фильтр:
                </Typography>
                
                <FormControl variant="outlined" size="small" className={classes.filterField}>
                    <InputLabel>Поле</InputLabel>
                    <Select
                        value={filterField}
                        onChange={handleFilterFieldChange}
                        label="Поле"
                    >
                        <MenuItem value="all">Все поля</MenuItem>
                        <MenuItem value="number">Номер</MenuItem>
                        <MenuItem value="version">Исполнение</MenuItem>
                        <MenuItem value="author">Автор</MenuItem>
                        <MenuItem value="date">Дата</MenuItem>
                        <MenuItem value="project">Проект</MenuItem>
                        <MenuItem value="comment">Комментарий</MenuItem>
                    </Select>
                </FormControl>
                
                <TextField
                    className={classes.searchField}
                    variant="outlined"
                    size="small"
                    placeholder="Введите текст для поиска..."
                    value={searchText}
                    onChange={handleSearchTextChange}
                    InputProps={{
                        startAdornment: (
                            <InputAdornment position="start">
                                <SearchIcon />
                            </InputAdornment>
                        ),
                    }}
                />
                
                <Button 
                    variant="outlined" 
                    color="secondary" 
                    onClick={clearFilter}
                    disabled={!searchText && filterField === 'all'}
                >
                    Сбросить
                </Button>
            </Paper>
            
            {/* Показываем информацию о результатах поиска, если есть фильтр */}
            {searchText && (
                <Typography variant="body2" style={{ marginBottom: 8 }}>
                    Найдено результатов: {filteredDocuments.length} из {documents.length}
                </Typography>
            )}
            
            <div className={classes.dataGridContainer}>
                <DataGrid 
                    rows={filteredDocuments} 
                    columns={columns} 
                    pageSize={pageSize} 
                    page={page}
                    onPageChange={handlePageChange}
                    getRowId={(row) => row._id}
                    hideFooterPagination
                    hideFooter
                    sortModel={sortModel}
                    onSortModelChange={handleSortModelChange}
                    className={classes.hideSortIcons}
                    disableColumnMenu={true}
                    disableColumnFilter={true}
                    disableMultipleColumnsSorting={true}
                    disableSelectionOnClick={true}
                />
                
                {paginationComponent}
            </div>
            
            <AddDocumentDialog 
                open={openAddDialog}
                setOpen={setOpenAddDialog}
                currentUser={currentUser}
                selectedFolder={selectedFolder}
                documents={documents}
                setDocuments={setDocuments}
            />
            
            <ReserveAlbumDialog open={openReserveDialog}
                                setOpen={setOpenReserveDialog}
                                selectedFolder={selectedFolder}
                                setSelectedFolder={setSelectedFolder}
                                currentUser={currentUser}
                                documents={documents}
                                selectedOrg={selectedOrg}
                                reFetchFolders={reFetchFolders}
            />
            
            <DocumentInfoDialog open={openInfoDialog}
                                setOpen={setOpenInfoDialog}
                                currentDocument={selectedDoc}
            />
            
            <EditDocumentDialog open={openEditDialog}
                                setOpen={setOpenEditDialog}
                                currentUser={currentUser}
                                selectedFolder={selectedFolder}
                                documents={documents}
                                setDocuments={setDocuments}
                                currentDocument={selectedDoc}
            />
            
            <DeleteDocDialog open={openDeleteDialog}
                             setOpen={setOpenDeleteDialog}
                             docToDeleteId={docToDeleteId}
                             setDocToDelete={setDocToDeleteId}
                             documents={documents}
                             setDocuments={setDocuments}
            />
        </div>
    );
}

export default DocumentsTable;