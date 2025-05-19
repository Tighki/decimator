import {createStyles, makeStyles, Theme} from "@material-ui/core/styles";
import {
    Button,
    Container, Divider,
    List,
    ListItem,
    ListItemIcon,
    ListItemText,
    Paper,
    TextField,
    Typography
} from "@material-ui/core";
import React, {useEffect} from "react";
import {getToken} from "../../../utils/auth";
import {useToasts} from "react-toast-notifications";
import {I_FolderGroup, I_FolderGroupBase, I_Organization} from "../../../types/org";
import {PermMedia} from "@material-ui/icons";

const useStyles = makeStyles((theme: Theme) =>
    createStyles({
        root: {
            maxHeight: '80%',
            display: 'flex'
        },
        form: {
            maxHeight: '70%',
            width: '100%'
        },
        paper: {
            marginTop: '20px',
            marginLeft: '30px',
            width: '100%',
            height: '100%',
            overflow: 'auto',
        },
    }),
);

type OrgFolderGroupsProp = {
    org: I_Organization | null
};

const OrgFolderGroups = ({org}: OrgFolderGroupsProp) => {
    const classes = useStyles();
    const {addToast} = useToasts();

    const [fgs, setFgs] = React.useState<I_FolderGroup[]>([]);
    const [name, setName] = React.useState<string>('');
    const [description, setDescription] = React.useState<string | undefined>('');

    const fetchFolderGroups = () => {
        const headers = new Headers();

        let token = getToken()
        headers.append("Authorization", token);
        headers.append("Accept", 'application/json');

        const options = {
            method: 'GET',
            headers
        };

        const route = `http://${process.env.REACT_APP_API_URI}/api/v1/orgs/${org?._id}/folder_groups`;
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
            })
            .catch(error => {
                addToast('При загрузке списка групп папок произошла ошибка...', {
                    appearance: 'error',
                    autoDismiss: true,
                });
            });
    };

    const addFolderGroup = (data: I_FolderGroupBase) => {
        const headers = new Headers();

        let token = getToken()
        headers.append("Authorization", token);
        headers.append("Accept", 'application/json');

        const options = {
            method: 'POST',
            body: JSON.stringify(data),
            headers
        };

        const route = `http://${process.env.REACT_APP_API_URI}/api/v1/orgs/${org?._id}/folder_groups`;
        fetch(route, options)
            .then(res => {
                return res.json();
            })
            .then(res => {
                if (res['detail']) {
                    throw (res['detail']);
                }
                // addToast('Группа папок создана!', {
                //     appearance: 'success',
                //     autoDismiss: true,
                // });
                setFgs([...fgs, res])
            })
            .catch(error => {
                addToast('При создании группы папок произошла ошибка...', {
                    appearance: 'error',
                    autoDismiss: true,
                });
            });
    };

    useEffect(() => {
        fetchFolderGroups();
    }, []);

    const handleChange = (event: any) => {
        event.preventDefault();
        switch (event.target.id) {
            case 'name': {
                setName(event.target.value);
                break;
            }
            case 'description': {
                setDescription(event.target.value);
                break;
            }
        }
    };

    const onAddNewClicked = (event: any) => {
        event.preventDefault();
        addFolderGroup({name, description, orgId: org?._id})
    };

    return (
        <Container className={classes.root} maxWidth='xl'>
            <div className={classes.form}>
                <TextField
                    autoFocus
                    variant="outlined"
                    margin="normal"
                    required
                    fullWidth
                    label="Название раздела (группы папок)"
                    name="name"
                    id="name"
                    value={name}
                    onChange={handleChange}
                >

                </TextField>
                <TextField
                    variant="outlined"
                    margin="normal"
                    fullWidth
                    multiline
                    rows={4}
                    label="Описание"
                    name="description"
                    id="description"
                    value={description}
                    onChange={handleChange}
                >

                </TextField>
                <Button variant='contained' color='primary' fullWidth onClick={onAddNewClicked}>
                    Добавить
                </Button>
            </ div>
            <Paper className={classes.paper}>
                <Typography align='center' variant='h5'>
                    Существующие группы папок
                </Typography>
                <List component="div" role='list'>
                    <Divider />
                    {fgs.map(fg => {
                        return (
                            <ListItem key={fg._id} role="listitem">
                                <ListItemIcon>
                                    <PermMedia />
                                </ListItemIcon>
                                <ListItemText id={fg._id} primary={fg.name}/>
                                <Divider />
                            </ListItem>
                        );
                    })}
                </List>
            </Paper>
        </Container>
    );
};

export default OrgFolderGroups;
