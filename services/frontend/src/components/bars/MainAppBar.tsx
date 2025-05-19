import React from 'react';
import {makeStyles, Theme} from '@material-ui/core/styles';
import AppBar from '@material-ui/core/AppBar';
import Toolbar from '@material-ui/core/Toolbar';
import Typography from '@material-ui/core/Typography';
import IconButton from '@material-ui/core/IconButton';
import AccountCircle from '@material-ui/icons/AccountCircle';
import MenuItem from '@material-ui/core/MenuItem';
import Menu from '@material-ui/core/Menu';
import {useHistory} from "react-router-dom";
import {I_CurrentUser} from "../../types/user";
import {capitalizeFirstLetter} from "../../utils/common";
import {I_Organization} from "../../types/org";
import {ListItemText} from "@material-ui/core";

const useStyles = makeStyles((theme: Theme) => ({
    appBar: {
        zIndex: theme.zIndex.drawer + 1,
    },
    menuButton: {
        marginRight: 36,
    },
    menuButtonHidden: {
        display: 'none',
    },
    title: {
        flexGrow: 1,
        cursor: 'pointer',
    },
    avatar: {
        display: 'flex',
        alignItems: 'center'
    },
    selectedOrg: {
        flexGrow: 1,
        flexDirection: 'row',
        display: 'flex'
    },
    divider: {
        marginLeft: 10,
        marginRight: 10,
        color: '#fafafa',
        border: '1px solid'
    },
    orgName: {
        color: '#d2d2d2'
    }
}));

type MainAppBarProps = {
    currentUser: I_CurrentUser | null
    selectedOrg: I_Organization | null
}

const MainAppBar = ({currentUser, selectedOrg}: MainAppBarProps) => {
    const classes = useStyles();
    const [anchorUserMenuEl, setAnchorUserMenuEl] = React.useState<null | HTMLElement>(null);
    const fn = capitalizeFirstLetter(currentUser?.firstName).charAt(0);
    const sn = capitalizeFirstLetter(currentUser?.secondName).charAt(0);
    const ln = capitalizeFirstLetter(currentUser?.lastName);
    const username = `${ln} ${fn}. ${sn}.`
    const history = useHistory();

    const openUserMenu = Boolean(anchorUserMenuEl);

    const handleMenu = (event: React.MouseEvent<HTMLElement>) => {
        setAnchorUserMenuEl(event.currentTarget);
    };

    const handleClose = () => {
        setAnchorUserMenuEl(null);
    };

    const logOut = () => {
        localStorage.removeItem('current_user')
        history.push('/login')
    }

    const navigateToHome = () => {
        window.location.href = '/';
    }

    const navigateToAdminPanel = () => {
        history.push('/admin');
    }

    return (
        <AppBar position="absolute" className={classes.appBar}>
            <Toolbar>
                <Typography 
                    component="h1" 
                    variant="h6" 
                    color="inherit" 
                    noWrap 
                    className={classes.title} 
                    onClick={navigateToHome}
                >
                    DecimatorWeb
                </Typography>
                <div className={classes.selectedOrg}>
                    {/*<Typography>*/}
                    {/*    Код: {selectedOrg?.code}*/}
                    {/*</Typography>*/}
                    {/*<Divider className={classes.divider} orientation='vertical' flexItem/>*/}
                    {/*<Typography>*/}
                    {/*    Организация: {selectedOrg?.name}*/}
                    {/*</Typography>*/}
                    <ListItemText primary={selectedOrg?.code} secondary={selectedOrg?.name}/>
                </div>
                <div className={classes.avatar}>
                    <Typography align="center">
                        {username}
                    </Typography>
                    <IconButton
                        aria-label="account of current user"
                        aria-controls="menu-appbar"
                        aria-haspopup="true"
                        onClick={handleMenu}
                        color="inherit"
                    >
                        <AccountCircle/>
                    </IconButton>
                    <Menu
                        id="menu-appbar"
                        anchorEl={anchorUserMenuEl}
                        anchorOrigin={{
                            vertical: 'top',
                            horizontal: 'right',
                        }}
                        keepMounted
                        transformOrigin={{
                            vertical: 'top',
                            horizontal: 'right',
                        }}
                        open={openUserMenu}
                        onClose={handleClose}
                    >
                        <MenuItem onClick={handleClose}>Профиль</MenuItem>
                        {currentUser?.isSuper && (
                            <MenuItem onClick={navigateToAdminPanel}>Панель администратора</MenuItem>
                        )}
                        <MenuItem onClick={logOut}>Выйти</MenuItem>
                    </Menu>
                </div>
            </Toolbar>
        </AppBar>
    );
};

export default MainAppBar;
