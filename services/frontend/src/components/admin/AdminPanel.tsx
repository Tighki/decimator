import React, { useEffect, useState } from 'react';
import { makeStyles, Theme, useTheme } from "@material-ui/core/styles";
import { 
  Container, 
  Typography, 
  Table, 
  TableBody, 
  TableCell, 
  TableContainer, 
  TableHead, 
  TableRow,
  IconButton,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Button,
  TextField,
  Snackbar,
  Grid,
  Card,
  CardContent,
  Avatar,
  Tooltip,
  AppBar,
  Tabs,
  Tab,
  InputAdornment,
  Box,
  Chip,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
} from "@material-ui/core";
import { 
  Edit, 
  Delete, 
  Refresh, 
  LockOpen, 
  Search, 
  SupervisorAccount, 
  Person, 
  PersonOutline,
  FileCopy
} from "@material-ui/icons";
import { Alert, Pagination } from "@material-ui/lab";
import MainAppBar from "../bars/MainAppBar";
import { useHistory } from "react-router-dom";
import { getToken } from "../../utils/auth";
import { I_CurrentUser } from "../../types/user";
import { useToasts } from "react-toast-notifications";
import Loader from "react-loader-spinner";

const useStyles = makeStyles((theme: Theme) => ({
  root: {
    padding: theme.spacing(2),
    marginTop: 64,
    backgroundColor: '#f5f7fa',
    minHeight: 'calc(100vh - 64px)',
  },
  title: {
    margin: theme.spacing(2, 0),
    fontWeight: 500,
    color: theme.palette.primary.main,
  },
  statsContainer: {
    marginBottom: theme.spacing(3),
  },
  statCard: {
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
    padding: theme.spacing(2),
    transition: 'all 0.3s ease',
    '&:hover': {
      transform: 'translateY(-4px)',
      boxShadow: theme.shadows[6],
    },
  },
  statIcon: {
    padding: theme.spacing(1),
    borderRadius: '50%',
    marginBottom: theme.spacing(1),
    width: 48,
    height: 48,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  statValue: {
    fontWeight: 'bold',
    fontSize: '1.8rem',
    marginBottom: theme.spacing(1),
  },
  statLabel: {
    color: theme.palette.text.secondary,
  },
  mainCard: {
    marginBottom: theme.spacing(3),
    borderRadius: 16,
    overflow: 'hidden',
  },
  cardHeader: {
    backgroundColor: theme.palette.primary.dark,
    color: 'white',
    padding: theme.spacing(2),
  },
  tabsContainer: {
    backgroundColor: theme.palette.primary.main,
    marginBottom: theme.spacing(2),
  },
  tab: {
    color: 'white',
    minWidth: 120,
    '&.Mui-selected': {
      color: 'white',
      fontWeight: 'bold',
    },
  },
  searchBar: {
    marginBottom: theme.spacing(2),
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: theme.spacing(2),
  },
  searchField: {
    minWidth: 300,
    backgroundColor: 'white',
    borderRadius: 4,
    '& .MuiOutlinedInput-root': {
      '& fieldset': {
        borderColor: 'rgba(0, 0, 0, 0.12)',
      },
      '&:hover fieldset': {
        borderColor: theme.palette.primary.main,
      },
    },
  },
  filterChip: {
    margin: theme.spacing(0, 0.5),
    backgroundColor: 'white',
  },
  tableContainer: {
    backgroundColor: 'white',
    borderRadius: 8,
    overflow: 'hidden',
  },
  table: {
    minWidth: 650,
    '& .MuiTableCell-head': {
      backgroundColor: theme.palette.grey[100],
      fontWeight: 'bold',
    },
  },
  actionButton: {
    marginRight: theme.spacing(1),
  },
  adminChip: {
    backgroundColor: theme.palette.primary.main,
    color: 'white',
    fontWeight: 'bold',
  },
  userChip: {
    backgroundColor: theme.palette.grey[300],
  },
  activeChip: {
    backgroundColor: theme.palette.success.main,
    color: 'white',
  },
  inactiveChip: {
    backgroundColor: theme.palette.error.main,
    color: 'white',
  },
  avatar: {
    backgroundColor: theme.palette.primary.dark,
    width: theme.spacing(4),
    height: theme.spacing(4),
  },
  paginationContainer: {
    display: 'flex',
    justifyContent: 'center',
    padding: theme.spacing(2),
  },
  buttonContainer: {
    display: 'flex',
    justifyContent: 'flex-end',
    marginTop: theme.spacing(2),
    gap: theme.spacing(1),
  },
  actionIconDelete: {
    color: theme.palette.error.main,
  },
  actionIconEdit: {
    color: theme.palette.primary.main,
  },
  actionIconRestore: {
    color: theme.palette.success.main,
  },
  actionIconPassword: {
    color: theme.palette.warning.main,
  },
  backdrop: {
    zIndex: theme.zIndex.drawer + 1,
  },
  filterSelect: {
    minWidth: 200,
    backgroundColor: 'white',
  },
  fieldLabel: {
    marginBottom: theme.spacing(1),
    fontWeight: 'bold',
  },
  copyButton: {
    marginLeft: theme.spacing(1),
  },
}));

interface TabPanelProps {
  children?: React.ReactNode;
  index: any;
  value: any;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`simple-tabpanel-${index}`}
      aria-labelledby={`simple-tab-${index}`}
      style={{ padding: '16px 0' }}
      {...other}
    >
      {value === index && <Box>{children}</Box>}
    </div>
  );
}

interface User {
  _id: string;
  firstName: string;
  secondName: string;
  lastName: string;
  login: string;
  isActive: boolean;
  isSuper: boolean;
  created: string;
}

const AdminPanel: React.FC = () => {
  const classes = useStyles();
  const theme = useTheme();
  const history = useHistory();
  const { addToast } = useToasts();
  
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [currentUser, setCurrentUser] = useState<I_CurrentUser | null>(null);
  const [loading, setLoading] = useState(false);
  
  // Стейты для табов и пагинации
  const [tabValue, setTabValue] = useState(0);
  const [page, setPage] = useState(1);
  const [rowsPerPage] = useState(10);
  
  // Стейты для поиска и фильтрации
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [roleFilter, setRoleFilter] = useState("all");
  
  // Диалоги
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [openLoginDialog, setOpenLoginDialog] = useState(false);
  const [openPasswordDialog, setOpenPasswordDialog] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  
  // Поля формы
  const [newLogin, setNewLogin] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [snackbarSeverity, setSnackbarSeverity] = useState<"success" | "error" | "info" | "warning">("success");

  useEffect(() => {
    getCurrentUser();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  
  useEffect(() => {
    if (currentUser && currentUser.isSuper) {
      fetchUsers();
    } else if (currentUser) {
      // Если пользователь не админ, перенаправляем на главную
      history.push('/');
      addToast('У вас нет прав для доступа к панели администратора', {
        appearance: 'error',
        autoDismiss: true,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser]);

  // Эффект для обработки фильтров
  useEffect(() => {
    applyFilters();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [users, searchQuery, statusFilter, roleFilter]);

  const applyFilters = () => {
    let result = [...users];
    
    // Применяем поиск
    if (searchQuery) {
      const lowerQuery = searchQuery.toLowerCase();
      result = result.filter(user => 
        user.firstName.toLowerCase().includes(lowerQuery) || 
        user.lastName.toLowerCase().includes(lowerQuery) || 
        user.secondName.toLowerCase().includes(lowerQuery) || 
        user.login.toLowerCase().includes(lowerQuery)
      );
    }
    
    // Применяем фильтр статуса
    if (statusFilter !== "all") {
      const isActive = statusFilter === "active";
      result = result.filter(user => user.isActive === isActive);
    }
    
    // Применяем фильтр роли
    if (roleFilter !== "all") {
      const isSuper = roleFilter === "admin";
      result = result.filter(user => user.isSuper === isSuper);
    }
    
    setFilteredUsers(result);
  };

  const getCurrentUser = () => {
    const headers = new Headers();
    const token = getToken();
    headers.append("Authorization", token);
    headers.append("Accept", "application/json");

    const options = {
      method: 'GET',
      headers
    };
    
    setLoading(true);
    const route = `http://${process.env.REACT_APP_API_URI}/api/v1/users/me`;
    
    fetch(route, options)
      .then(res => res.json())
      .then(res => {
        if (res['detail']) {
          throw (res['detail']);
        }
        setCurrentUser({...res});
      })
      .catch(error => {
        addToast('Не удалось получить данные пользователя', {
          appearance: 'error',
          autoDismiss: true,
        });
        localStorage.removeItem('current_user');
        history.push('/login');
      })
      .finally(() => setLoading(false));
  };
  
  const fetchUsers = () => {
    const headers = new Headers();
    const token = getToken();
    headers.append("Authorization", token);
    headers.append("Accept", "application/json");

    const options = {
      method: 'GET',
      headers
    };
    
    setLoading(true);
    const route = `http://${process.env.REACT_APP_API_URI}/api/v1/users/`;
    
    fetch(route, options)
      .then(res => res.json())
      .then(res => {
        if (res['detail']) {
          throw (res['detail']);
        }
        setUsers(res);
      })
      .catch(error => {
        addToast('Не удалось получить список пользователей', {
          appearance: 'error',
          autoDismiss: true,
        });
      })
      .finally(() => setLoading(false));
  };
  
  const handleDeleteUser = () => {
    if (!selectedUser) return;
    
    const headers = new Headers();
    const token = getToken();
    headers.append("Authorization", token);
    headers.append("Accept", "application/json");

    const options = {
      method: 'DELETE',
      headers
    };
    
    setLoading(true);
    const route = `http://${process.env.REACT_APP_API_URI}/api/v1/users/${selectedUser._id}`;
    
    console.log('Отправка запроса на удаление:', route);
    
    fetch(route, options)
      .then(res => {
        console.log('Статус ответа:', res.status, res.statusText);
        return res.json().catch(err => {
          console.error('Ошибка при разборе JSON:', err);
          throw new Error(`Ошибка сервера: ${res.status} ${res.statusText}`);
        });
      })
      .then(res => {
        console.log('Ответ сервера:', res);
        if (res['detail']) {
          throw new Error(res['detail']);
        }
        showSnackbar("Пользователь успешно деактивирован", "success");
        fetchUsers(); // Обновляем список пользователей
      })
      .catch(error => {
        console.error('Ошибка при деактивации пользователя:', error);
        showSnackbar(`Ошибка при деактивации пользователя: ${error.message || JSON.stringify(error)}`, "error");
      })
      .finally(() => {
        setLoading(false);
        setOpenDeleteDialog(false);
      });
  };
  
  const handleRestoreUser = (user: User) => {
    const headers = new Headers();
    const token = getToken();
    headers.append("Authorization", token);
    headers.append("Accept", "application/json");

    const options = {
      method: 'POST',
      headers
    };
    
    setLoading(true);
    const route = `http://${process.env.REACT_APP_API_URI}/api/v1/users/${user._id}/restore`;
    
    fetch(route, options)
      .then(res => res.json())
      .then(res => {
        if (res['detail']) {
          throw (res['detail']);
        }
        showSnackbar("Пользователь успешно восстановлен", "success");
        fetchUsers(); // Обновляем список пользователей
      })
      .catch(error => {
        showSnackbar("Ошибка при восстановлении пользователя", "error");
      })
      .finally(() => {
        setLoading(false);
      });
  };
  
  const handleUpdateLogin = () => {
    if (!selectedUser || !newLogin) return;
    
    const headers = new Headers();
    const token = getToken();
    headers.append("Authorization", token);
    headers.append("Accept", "application/json");

    const options = {
      method: 'PUT',
      headers
    };
    
    setLoading(true);
    const route = `http://${process.env.REACT_APP_API_URI}/api/v1/users/${selectedUser._id}/login/${newLogin}`;
    
    fetch(route, options)
      .then(res => res.json())
      .then(res => {
        if (res['detail']) {
          throw (res['detail']);
        }
        showSnackbar("Логин пользователя успешно обновлен", "success");
        fetchUsers(); // Обновляем список пользователей
      })
      .catch(error => {
        showSnackbar("Ошибка при обновлении логина пользователя", "error");
      })
      .finally(() => {
        setLoading(false);
        setOpenLoginDialog(false);
        setNewLogin("");
      });
  };
  
  const handleUpdatePassword = () => {
    if (!selectedUser || !newPassword || newPassword !== confirmPassword) {
      showSnackbar("Пароли не совпадают", "error");
      return;
    }
    
    const headers = new Headers();
    const token = getToken();
    headers.append("Authorization", token);
    headers.append("Accept", "application/json");
    headers.append("Content-Type", "application/json");

    const options = {
      method: 'PUT',
      headers,
      body: JSON.stringify({ password: newPassword })
    };
    
    setLoading(true);
    const route = `http://${process.env.REACT_APP_API_URI}/api/v1/users/${selectedUser._id}/password`;
    
    fetch(route, options)
      .then(res => res.json())
      .then(res => {
        if (res['detail']) {
          throw (res['detail']);
        }
        showSnackbar("Пароль пользователя успешно обновлен", "success");
      })
      .catch(error => {
        showSnackbar("Ошибка при обновлении пароля пользователя", "error");
      })
      .finally(() => {
        setLoading(false);
        setOpenPasswordDialog(false);
        setNewPassword("");
        setConfirmPassword("");
      });
  };
  
  const openDeleteConfirmation = (user: User) => {
    setSelectedUser(user);
    setOpenDeleteDialog(true);
  };
  
  const openLoginEdit = (user: User) => {
    setSelectedUser(user);
    setNewLogin(user.login);
    setOpenLoginDialog(true);
  };
  
  const openPasswordEdit = (user: User) => {
    setSelectedUser(user);
    setNewPassword("");
    setConfirmPassword("");
    setOpenPasswordDialog(true);
  };
  
  const showSnackbar = (message: string, severity: "success" | "error" | "info" | "warning") => {
    setSnackbarMessage(message);
    setSnackbarSeverity(severity);
    setSnackbarOpen(true);
  };
  
  const handleSnackbarClose = () => {
    setSnackbarOpen(false);
  };
  
  const handleTabChange = (event: React.ChangeEvent<{}>, newValue: number) => {
    setTabValue(newValue);
  };
  
  const handleChangePage = (event: React.ChangeEvent<unknown>, value: number) => {
    setPage(value);
  };
  
  const handleResetFilters = () => {
    setSearchQuery("");
    setStatusFilter("all");
    setRoleFilter("all");
  };
  
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
      .then(() => {
        showSnackbar("Скопировано в буфер обмена", "success");
      })
      .catch(err => {
        showSnackbar("Не удалось скопировать в буфер обмена", "error");
      });
  };
  
  // Подсчет статистики
  const totalUsers = users.length;
  const activeUsers = users.filter(user => user.isActive).length;
  const adminUsers = users.filter(user => user.isSuper).length;
  
  // Получаем текущую страницу данных
  const currentPageData = filteredUsers.slice(
    (page - 1) * rowsPerPage,
    page * rowsPerPage
  );
  
  // Общее количество страниц
  const totalPages = Math.ceil(filteredUsers.length / rowsPerPage);

  return (
    <>
      <MainAppBar currentUser={currentUser} selectedOrg={null} />
      <Container className={classes.root}>
        
        {/* Карточки со статистикой */}
        <Grid container spacing={3} className={classes.statsContainer}>
          <Grid item xs={12} sm={4}>
            <Card className={classes.statCard} elevation={2}>
              <div className={classes.statIcon} style={{ backgroundColor: theme.palette.primary.light }}>
                <Person style={{ color: theme.palette.primary.dark }} />
              </div>
              <Typography className={classes.statValue}>{totalUsers}</Typography>
              <Typography className={classes.statLabel}>Всего пользователей</Typography>
            </Card>
          </Grid>
          <Grid item xs={12} sm={4}>
            <Card className={classes.statCard} elevation={2}>
              <div className={classes.statIcon} style={{ backgroundColor: theme.palette.success.light }}>
                <PersonOutline style={{ color: theme.palette.success.dark }} />
              </div>
              <Typography className={classes.statValue}>{activeUsers}</Typography>
              <Typography className={classes.statLabel}>Активных пользователей</Typography>
            </Card>
          </Grid>
          <Grid item xs={12} sm={4}>
            <Card className={classes.statCard} elevation={2}>
              <div className={classes.statIcon} style={{ backgroundColor: theme.palette.warning.light }}>
                <SupervisorAccount style={{ color: theme.palette.warning.dark }} />
              </div>
              <Typography className={classes.statValue}>{adminUsers}</Typography>
              <Typography className={classes.statLabel}>Администраторов</Typography>
            </Card>
          </Grid>
        </Grid>
        
        {/* Главная карточка с табами */}
        <Card className={classes.mainCard} elevation={3}>
          <AppBar position="static" className={classes.tabsContainer}>
            <Tabs 
              value={tabValue} 
              onChange={handleTabChange}
              indicatorColor="secondary"
              textColor="inherit"
              aria-label="admin tabs"
              centered
            >
              <Tab label="Пользователи" className={classes.tab} />
              <Tab label="Статистика" className={classes.tab} disabled />
              <Tab label="Логи" className={classes.tab} disabled />
            </Tabs>
          </AppBar>
          
          <CardContent>
            <TabPanel value={tabValue} index={0}>
              {/* Строка поиска и фильтров */}
              <div className={classes.searchBar}>
                <TextField
                  className={classes.searchField}
                  placeholder="Поиск пользователей..."
                  variant="outlined"
                  size="small"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Search />
                      </InputAdornment>
                    ),
                  }}
                />
                
                <div>
                  <FormControl variant="outlined" size="small" className={classes.filterSelect}>
                    <InputLabel id="status-filter-label">Статус</InputLabel>
                    <Select
                      labelId="status-filter-label"
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value as string)}
                      label="Статус"
                    >
                      <MenuItem value="all">Все статусы</MenuItem>
                      <MenuItem value="active">Активные</MenuItem>
                      <MenuItem value="inactive">Неактивные</MenuItem>
                    </Select>
                  </FormControl>
                  
                  <FormControl variant="outlined" size="small" className={classes.filterSelect} style={{ marginLeft: 8 }}>
                    <InputLabel id="role-filter-label">Роль</InputLabel>
                    <Select
                      labelId="role-filter-label"
                      value={roleFilter}
                      onChange={(e) => setRoleFilter(e.target.value as string)}
                      label="Роль"
                    >
                      <MenuItem value="all">Все роли</MenuItem>
                      <MenuItem value="admin">Администраторы</MenuItem>
                      <MenuItem value="user">Пользователи</MenuItem>
                    </Select>
                  </FormControl>
                  
                  <Button 
                    variant="outlined" 
                    color="primary" 
                    onClick={handleResetFilters}
                    style={{ marginLeft: 8 }}
                    disabled={!searchQuery && statusFilter === "all" && roleFilter === "all"}
                  >
                    Сбросить
                  </Button>
                </div>
              </div>
              
              {/* Результаты фильтрации */}
              {filteredUsers.length > 0 && (
                <Typography variant="body2" style={{ marginBottom: 16 }}>
                  Найдено пользователей: {filteredUsers.length}
                </Typography>
              )}
              
              {/* Таблица пользователей */}
              <TableContainer className={classes.tableContainer}>
                <Table className={classes.table}>
                  <TableHead>
                    <TableRow>
                      <TableCell>Пользователь</TableCell>
                      <TableCell>Логин</TableCell>
                      <TableCell>Роль</TableCell>
                      <TableCell>Статус</TableCell>
                      <TableCell align="right">Действия</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {currentPageData.length > 0 ? (
                      currentPageData.map((user) => (
                        <TableRow key={user._id}>
                          <TableCell>
                            <div style={{ display: 'flex', alignItems: 'center' }}>
                              <Avatar className={classes.avatar}>
                                {user.firstName[0]}{user.lastName[0]}
                              </Avatar>
                              <div style={{ marginLeft: 12 }}>
                                <Typography variant="body1">
                                  {user.lastName} {user.firstName} {user.secondName}
                                </Typography>
                                <Typography variant="caption" color="textSecondary">
                                  ID: {user._id}
                                </Typography>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div style={{ display: 'flex', alignItems: 'center' }}>
                              {user.login}
                              <Tooltip title="Копировать логин">
                                <IconButton 
                                  size="small" 
                                  className={classes.copyButton}
                                  onClick={() => copyToClipboard(user.login)}
                                >
                                  <FileCopy fontSize="small" />
                                </IconButton>
                              </Tooltip>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Chip 
                              label={user.isSuper ? "Администратор" : "Пользователь"} 
                              className={user.isSuper ? classes.adminChip : classes.userChip}
                              size="small"
                            />
                          </TableCell>
                          <TableCell>
                            <Chip 
                              label={user.isActive ? "Активен" : "Неактивен"} 
                              className={user.isActive ? classes.activeChip : classes.inactiveChip}
                              size="small"
                            />
                          </TableCell>
                          <TableCell align="right">
                            <Tooltip title="Изменить логин">
                              <IconButton 
                                aria-label="Изменить логин" 
                                className={classes.actionButton}
                                onClick={() => openLoginEdit(user)}
                              >
                                <Edit fontSize="small" className={classes.actionIconEdit} />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Изменить пароль">
                              <IconButton 
                                aria-label="Изменить пароль" 
                                className={classes.actionButton}
                                onClick={() => openPasswordEdit(user)}
                              >
                                <LockOpen fontSize="small" className={classes.actionIconPassword} />
                              </IconButton>
                            </Tooltip>
                            
                            {user.isActive ? (
                              <Tooltip title="Деактивировать">
                                <span>
                                  <IconButton 
                                    aria-label="Деактивировать" 
                                    className={classes.actionButton}
                                    onClick={() => openDeleteConfirmation(user)}
                                    disabled={user._id === currentUser?._id} // Нельзя деактивировать самого себя
                                  >
                                    <Delete fontSize="small" className={classes.actionIconDelete} />
                                  </IconButton>
                                </span>
                              </Tooltip>
                            ) : (
                              <Tooltip title="Восстановить">
                                <IconButton 
                                  aria-label="Восстановить" 
                                  className={classes.actionButton}
                                  onClick={() => handleRestoreUser(user)}
                                >
                                  <Refresh fontSize="small" className={classes.actionIconRestore} />
                                </IconButton>
                              </Tooltip>
                            )}
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={5} align="center">
                          Пользователи не найдены
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
              
              {/* Пагинация */}
              {totalPages > 1 && (
                <div className={classes.paginationContainer}>
                  <Pagination 
                    count={totalPages} 
                    page={page} 
                    onChange={handleChangePage} 
                    color="primary" 
                    shape="rounded"
                  />
                </div>
              )}
              
              <div className={classes.buttonContainer}>
                <Button 
                  variant="contained" 
                  color="primary" 
                  onClick={fetchUsers}
                  disabled={loading}
                >
                  Обновить список
                </Button>
              </div>
            </TabPanel>
            
            <TabPanel value={tabValue} index={1}>
              <Typography>Статистика (в разработке)</Typography>
            </TabPanel>
            
            <TabPanel value={tabValue} index={2}>
              <Typography>Логи (в разработке)</Typography>
            </TabPanel>
          </CardContent>
        </Card>
      </Container>
      
      {/* Диалог удаления пользователя */}
      <Dialog
        open={openDeleteDialog}
        onClose={() => setOpenDeleteDialog(false)}
        PaperProps={{
          style: { borderRadius: 8 }
        }}
      >
        <DialogTitle>Подтверждение деактивации</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Вы действительно хотите деактивировать пользователя {selectedUser ? `${selectedUser.lastName} ${selectedUser.firstName} ${selectedUser.secondName}` : ''}?
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDeleteDialog(false)} color="primary">
            Отмена
          </Button>
          <Button onClick={handleDeleteUser} color="secondary">
            Деактивировать
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Диалог изменения логина */}
      <Dialog
        open={openLoginDialog}
        onClose={() => setOpenLoginDialog(false)}
        PaperProps={{
          style: { borderRadius: 8 }
        }}
      >
        <DialogTitle>Изменение логина</DialogTitle>
        <DialogContent>
          <Typography className={classes.fieldLabel}>Текущий логин: {selectedUser?.login}</Typography>
          <TextField
            autoFocus
            margin="dense"
            label="Новый логин"
            type="text"
            fullWidth
            variant="outlined"
            value={newLogin}
            onChange={(e) => setNewLogin(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenLoginDialog(false)} color="primary">
            Отмена
          </Button>
          <Button onClick={handleUpdateLogin} color="primary" disabled={!newLogin}>
            Сохранить
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Диалог изменения пароля */}
      <Dialog
        open={openPasswordDialog}
        onClose={() => setOpenPasswordDialog(false)}
        PaperProps={{
          style: { borderRadius: 8 }
        }}
      >
        <DialogTitle>Изменение пароля</DialogTitle>
        <DialogContent>
          <Typography className={classes.fieldLabel}>
            Пользователь: {selectedUser ? `${selectedUser.lastName} ${selectedUser.firstName} ${selectedUser.secondName}` : ''}
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <TextField
                autoFocus
                margin="dense"
                label="Новый пароль"
                type="password"
                fullWidth
                variant="outlined"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                margin="dense"
                label="Подтвердите пароль"
                type="password"
                fullWidth
                variant="outlined"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                error={newPassword !== confirmPassword && confirmPassword !== ''}
                helperText={newPassword !== confirmPassword && confirmPassword !== '' ? 'Пароли не совпадают' : ''}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenPasswordDialog(false)} color="primary">
            Отмена
          </Button>
          <Button 
            onClick={handleUpdatePassword} 
            color="primary" 
            disabled={!newPassword || newPassword !== confirmPassword}
          >
            Сохранить
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Snackbar для уведомлений */}
      <Snackbar open={snackbarOpen} autoHideDuration={6000} onClose={handleSnackbarClose}>
        <Alert onClose={handleSnackbarClose} severity={snackbarSeverity}>
          {snackbarMessage}
        </Alert>
      </Snackbar>
      
      {/* Loader */}
      {loading && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 9999,
        }}>
          <Loader type="Audio" color="#ffffff" height={100} width={100} />
        </div>
      )}
    </>
  );
};

export default AdminPanel; 