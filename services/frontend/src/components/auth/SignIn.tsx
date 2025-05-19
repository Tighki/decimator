import React, {useEffect} from "react";
import {
    Avatar,
    Box,
    Button,
    Container,
    CssBaseline,
    makeStyles,
    TextField,
    Tooltip,
    Typography,
} from "@material-ui/core";
import LockOutlinedIcon from "@material-ui/icons/LockOutlined";
import {useHistory} from "react-router-dom";
import Copyright from "../common/Copyright";
import {I_UserCredential} from "../../types/user";
import {useToasts} from "react-toast-notifications";
import Loader from "react-loader-spinner";


const useStyles = makeStyles(theme => ({
    '@global': {
        body: {
            backgroundColor: theme.palette.common.white,
        },
    },
    paper: {
        marginTop: theme.spacing(8),
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
    },
    avatar: {
        margin: theme.spacing(1),
        backgroundColor: theme.palette.secondary.main,
    },
    form: {
        width: '100%',
        marginTop: theme.spacing(1),
    },
    submit: {
        margin: theme.spacing(3, 0, 0),
    },
}));

const SignIn = () => {
    const classes = useStyles();
    const {addToast} = useToasts();

    const [login, setLogin] = React.useState<string>('');
    const [password, setPassword] = React.useState<string>('');
    const [pending, setPending] = React.useState<boolean>(false)

    const history = useHistory();

    const loginUser = (user_cred: I_UserCredential) => {
        const headers = new Headers();

        headers.append("Accept", "application/json");
        headers.append("Content-Type", "application/json");

        const options = {
            method: 'POST',
            body: JSON.stringify(user_cred),
            headers
        };
        const route = `http://${process.env.REACT_APP_API_URI}/api/v1/users/auth/login`;
        setPending(true);
        return fetch(route, options)
            .then(res => {
                setPending(false);
                return res.json();
            })
            .then(res => {
                if (res['detail']) {
                    throw (res['detail'])
                }
                // addToast('Успешный вход!', {
                //     appearance: 'success',
                //     autoDismiss: true,
                // });
                localStorage.setItem('current_user', JSON.stringify(res));
                history.push('/');
            })
            .catch(error => {
                addToast('Не удалось войти', {
                    appearance: 'error',
                    autoDismiss: true,
                });
            });
    };

    const onLoginButtonClick = (event: React.MouseEvent<HTMLElement>) => {
        event.preventDefault();
        loginUser({login, password})
    };

    const onRegisterButtonClick = (event: React.MouseEvent<HTMLElement>) => {
        event.preventDefault();
        history.push('/registration')
    };

    const handleChange = (event: any) => {
        event.preventDefault();

        switch (event.target.id) {
            case 'username': {
                setLogin(event.target.value);
                break;
            }
            case 'password': {
                setPassword(event.target.value);
                break;
            }
        }
    };

    useEffect(() => {
            let storedUser: string | null = localStorage.getItem('current_user');
            if (Boolean(storedUser)) {
                history.push('/')
            }
        }, [history]
    );

    return (
        <Container component="main" maxWidth="xs">
            <CssBaseline/>
            <div className={classes.paper}>
                <Avatar className={classes.avatar}>
                    {!pending &&
                    <LockOutlinedIcon/>
                    }
                    {pending &&
                    <Loader type="Circles" color="#ffffff" height={30} width={30}/>
                    }
                </Avatar>
                <Typography component="h1" variant="h5">
                    DecimatorWeb
                </Typography>
                <form className={classes.form} noValidate>
                    <TextField
                        variant="outlined"
                        margin="normal"
                        required
                        fullWidth
                        id="username"
                        label="Логин"
                        name="username"
                        autoFocus
                        value={login}
                        onChange={handleChange}
                    />
                    <TextField
                        variant="outlined"
                        margin="normal"
                        required
                        fullWidth
                        name="password"
                        label="Пароль"
                        type="password"
                        id="password"
                        autoComplete="current-password"
                        value={password}
                        onChange={handleChange}
                    />
                    <Button
                        type="submit"
                        fullWidth
                        variant="contained"
                        color="primary"
                        className={classes.submit}
                        onClick={onLoginButtonClick}
                    >
                        Вход
                    </Button>
                    <Tooltip title="Перейти на страницу регистрации">
                        <Button
                            type="submit"
                            fullWidth
                            variant="contained"
                            color="secondary"
                            className={classes.submit}
                            onClick={onRegisterButtonClick}
                        >
                            Регистрация
                        </Button>
                    </Tooltip>
                </form>
            </div>
            <Box mt={8}>
                <Copyright/>
            </Box>
        </Container>
    );
}

export default SignIn;
