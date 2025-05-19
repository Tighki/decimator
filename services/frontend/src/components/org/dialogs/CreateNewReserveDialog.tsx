import React from "react";
import {Button, Dialog, DialogActions, DialogContent, DialogTitle, TextField} from "@material-ui/core";
import {I_Folder} from "../../../types/folder";
import {useToasts} from "react-toast-notifications";
import {getToken} from "../../../utils/auth";
import {I_CurrentUser} from "../../../types/user";

type OpenProp = {
    open: boolean,
    setOpen: Function,
    selectedFolder: I_Folder | null
    reFetchFolders: Function
    setSelectedFolder: Function
    currentUser: I_CurrentUser | null
};

const CreateNewReserveDialog = ({open, setOpen, selectedFolder, currentUser, setSelectedFolder, reFetchFolders}: OpenProp) => {
    const {addToast} = useToasts();

    const [from_, setFrom_] = React.useState<number | string>('');
    const [to_, setTo_] = React.useState<number | string>('');
    const [description, setDescription] = React.useState<string>('');

    const createReserve = () => {
        const headers = new Headers();

        let token = getToken()
        headers.append("Authorization", token);
        headers.append("Accept", 'application/json');

        const options = {
            method: 'POST',
            body: JSON.stringify({from_, to_, description, authorId: currentUser?._id }),
            headers
        };

        const route = `http://${process.env.REACT_APP_API_URI}/api/v1/folders/${selectedFolder?._id}/reserves`;
        fetch(route, options)
            .then(res => {
                return res.json();
            })
            .then(res => {
                if (res['detail']) {
                    throw (res['detail']);
                }
                // addToast('Резерв создан!', {
                //     appearance: 'success',
                //     autoDismiss: true,
                // });
                setSelectedFolder(res);
                reFetchFolders();
            })
            .catch(error => {
                addToast('При создании резерва произошла ошибка...', {
                    appearance: 'error',
                    autoDismiss: true,
                });
            });
    };

    const handleClose = () => {
        setOpen(false);
        setFrom_('');
        setTo_('');
        setDescription('');
    };

    const handleCreateClick = () => {
        createReserve();
        handleClose();
    };

    const handleChange = (event: any) => {
        event.preventDefault();
        switch (event.target.id) {
            case 'from_': {
                setFrom_(event.target.value);
                break;
            }
            case 'to_': {
                setTo_(event.target.value);
                break;
            }
            case 'description': {
                setDescription(event.target.value);
                break;
            }
        }
    };

    return (
        <Dialog open={open}
                onClose={handleClose}
                aria-labelledby="confirmation-dialog-title">
            <DialogTitle id="confirmation-dialog-title">Добавление нового резерва</DialogTitle>
            <DialogContent dividers>
                <TextField
                    autoFocus
                    variant="outlined"
                    margin="normal"
                    required
                    fullWidth
                    type="folderName"
                    label="С"
                    name="from_"
                    id="from_"
                    value={from_}
                    onChange={handleChange}
                />
                <TextField
                    variant="outlined"
                    margin="normal"
                    required
                    fullWidth
                    type="folderName"
                    label="По"
                    name="to_"
                    id="to_"
                    value={to_}
                    onChange={handleChange}
                />
                <TextField
                    variant="outlined"
                    margin="normal"
                    required
                    fullWidth
                    label="Описание"
                    name="description"
                    id="description"
                    value={description}
                    onChange={handleChange}
                />
            </DialogContent>
            <DialogActions>
                <Button onClick={handleClose} color="primary">
                    Отмена
                </Button>
                <Button onClick={handleCreateClick} color="primary" disabled={!Boolean(description)}>
                    Добавить
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default CreateNewReserveDialog;
