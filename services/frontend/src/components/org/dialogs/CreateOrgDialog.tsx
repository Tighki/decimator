import React from "react";
import {Button, Dialog, DialogActions, DialogContent, DialogTitle, makeStyles, TextField} from "@material-ui/core";
import {useToasts} from "react-toast-notifications";
import {I_OrganizationBase} from "../../../types/org";
import {getToken} from "../../../utils/auth";

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
    form: {
        width: '100%', // Fix IE 11 issue.
        marginTop: theme.spacing(1),
    },
    formControl: {
        minWidth: 150,
    },
    docType: {
        width: '100%',
    },
    number: {
        paddingRight: "5px",
    },
    phone_and_code: {
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
    },
}));

type OpenProp = {
    open: boolean,
    setOpen: Function
    setPending: Function
    onOrgCreated: Function
};

const CreateOrgDialog = ({open, setOpen, setPending, onOrgCreated}: OpenProp) => {
    const classes = useStyles();
    const {addToast} = useToasts();

    const [name, setName] = React.useState<string>('');
    const [description, setDescription] = React.useState<string>('');
    const [address, setAddress] = React.useState<string>('');
    const [phone, setPhone] = React.useState<string>('');
    const [code, setCode] = React.useState<string>('');


    const createOrganization = (org: I_OrganizationBase) => {
        const headers = new Headers();

        let token = getToken()
        headers.append("Authorization", token);
        headers.append("Accept", 'application/json');

        const options = {
            method: 'POST',
            body: JSON.stringify(org),
            headers
        };

        const route = `http://${process.env.REACT_APP_API_URI}/api/v1/orgs/`;
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
                // addToast('Организация успешно создана!', {
                //     appearance: 'success',
                //     autoDismiss: true,
                // });
                onOrgCreated(res);
            })
            .catch(error => {
                addToast('При создании организации произошла ошибка...', {
                    appearance: 'error',
                    autoDismiss: true,
                });
            });
    };

    const handleClose = () => {
        setOpen(false)
        setName('')
        setDescription('')
        setAddress('')
        setPhone('')
        setCode('')
    };

    const handleCreateNew = () => {
        createOrganization({name, description, address, code, phone});
        handleClose();
    };

    const handleChange = (event: any) => {
        event.preventDefault();

        switch (event.target.id) {
            case 'phone': {
                setPhone(event.target.value);
                break;
            }
            case 'name': {
                setName(event.target.value);
                break;
            }
            case 'description': {
                setDescription(event.target.value);
                break;
            }
            case 'address': {
                setAddress(event.target.value);
                break;
            }
            case 'code': {
                setCode(event.target.value);
                break;
            }
        }
    };

    return (
        <Dialog open={open} onClose={handleClose} aria-labelledby="form-dialog-title">
            <DialogTitle id="form-dialog-title">Создание организации</DialogTitle>
            <DialogContent dividers>
                <form className={classes.form} noValidate>
                    <TextField
                        autoFocus
                        variant="outlined"
                        margin="normal"
                        required
                        fullWidth
                        label="Название"
                        name="name"
                        id="name"
                        value={name}
                        onChange={handleChange}
                    />
                    <TextField
                        type="text"
                        rows={4}
                        variant="outlined"
                        margin="normal"
                        fullWidth
                        multiline
                        label="Описание"
                        name="description"
                        id="description"
                        value={description}
                        onChange={handleChange}
                    />
                    <TextField
                        type="text"
                        variant="outlined"
                        margin="normal"
                        fullWidth
                        label="Адрес"
                        name="address"
                        id="address"
                        value={address}
                        onChange={handleChange}
                    />
                    <div className={classes.phone_and_code}>
                        <TextField
                            className={classes.number}
                            type="text"
                            variant="outlined"
                            margin="normal"
                            fullWidth
                            label="Телефон"
                            name="phone"
                            id="phone"
                            value={phone}
                            onChange={handleChange}
                        />
                        <TextField
                            type="text"
                            variant="outlined"
                            margin="normal"
                            required
                            fullWidth
                            label="Код"
                            name="code"
                            id="code"
                            value={code}
                            onChange={handleChange}
                        />
                    </div>
                </form>
            </DialogContent>
            <DialogActions>
                <Button onClick={handleClose} color="primary">
                    Отмена
                </Button>
                <Button onClick={handleCreateNew} color="primary">
                    Создать
                </Button>
            </DialogActions>
        </Dialog>
    )
};

export default CreateOrgDialog;
