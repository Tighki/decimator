import React, {useEffect} from "react";
import {Avatar, Box, Button, Container, CssBaseline, makeStyles, TextField, Typography} from "@material-ui/core";
import LockOutlinedIcon from "@material-ui/icons/LockOutlined";
import {useHistory} from "react-router-dom";
import Copyright from "../common/Copyright";
import {I_UserCreate} from "../../types/user";
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
    loader: {
        color: 'black',
        background: 'black'
    }
}));

const SignUp = () => {
    const classes = useStyles();
    const {addToast} = useToasts();

    const [login, setLogin] = React.useState<string>('');
    const [password, setPassword] = React.useState<string>('');
    const [firstName, setFirstName] = React.useState<string>('');
    const [secondName, setSecondName] = React.useState<string>('');
    const [lastName, setLastName] = React.useState<string>('');
    const [pending, setPending] = React.useState<boolean>(false);

    const history = useHistory();

    const registerNewUser = (user: I_UserCreate) => {
        const headers = new Headers();

        headers.append("Accept", "application/json");
        headers.append("Content-Type", "application/json");

        const options = {
            method: 'POST',
            body: JSON.stringify(user),
            headers
        };
        const route = `http://${process.env.REACT_APP_API_URI}/api/v1/users/`;
        setPending(true);
        return fetch(route, options)
            .then(res => {
                setPending(false);
                return res.json();
            })
            .then(res => {
                if (res['detail']) {
                    throw (res['detail']);
                }
                addToast('Пользователь успешно зарегестрирован!', {
                    appearance: 'success',
                    autoDismiss: true,
                });
                history.push('/login');
            })
            .catch(error => {
                addToast('При регистрации произошла ошибка.', {
                    appearance: 'error',
                    autoDismiss: true,
                });
            });
    };

    const onRegisterButtonClick = (event: React.MouseEvent<HTMLElement>) => {
        event.preventDefault();
        registerNewUser({login, password, firstName, secondName, lastName})
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
            case 'firstName': {
                setFirstName(event.target.value);
                break;
            }
            case 'secondName': {
                setSecondName(event.target.value);
                break;
            }
            case 'lastName': {
                setLastName(event.target.value);
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
                    <TextField
                        variant="outlined"
                        margin="normal"
                        required
                        fullWidth
                        name="firstName"
                        label="Имя"
                        id="firstName"
                        value={firstName}
                        onChange={handleChange}
                    />
                    <TextField
                        variant="outlined"
                        margin="normal"
                        required
                        fullWidth
                        name="secondName"
                        label="Отчество"
                        id="secondName"
                        value={secondName}
                        onChange={handleChange}
                    />
                    <TextField
                        variant="outlined"
                        margin="normal"
                        required
                        fullWidth
                        name="lastName"
                        label="Фамилия"
                        id="lastName"
                        value={lastName}
                        onChange={handleChange}
                    />
                    <Button
                        type="submit"
                        fullWidth
                        variant="contained"
                        color="primary"
                        className={classes.submit}
                        onClick={onRegisterButtonClick}
                    >
                        Зарегистрировать нового пользователя
                    </Button>
                </form>
            </div>
            <Box mt={8}>
                <Copyright/>
            </Box>
        </Container>
    );
}

export default SignUp;
