import React from "react";
import {Button, Dialog, DialogActions, DialogContent, DialogTitle, TextField} from "@material-ui/core";
import {useToasts} from "react-toast-notifications";
import {getToken} from "../../../utils/auth";
import {I_Folder} from "../../../types/folder";

type OpenProp = {
    open: boolean,
    setOpen: Function,
    fgsId?: string
    folders: I_Folder[],
    setFolders: Function,
    setSelectedFolder: Function
};

const AddFolderDialog = ({open, setOpen, fgsId, folders, setFolders, setSelectedFolder}: OpenProp) => {
    const {addToast} = useToasts();

    const [folderName, setFolderName] = React.useState<string>('');

    const handleClose = () => {
        setFolderName('');
        setOpen(false);
    };

    const createFolder = (name: string, fgId?: string) => {
        const headers = new Headers();

        let token = getToken()
        headers.append("Authorization", token);
        headers.append("Accept", 'application/json');

        const options = {
            method: 'POST',
            body: JSON.stringify({name, folderGroupId: fgId}),
            headers
        };

        const route = `http://${process.env.REACT_APP_API_URI}/api/v1/folders`;
        fetch(route, options)
            .then(res => {
                return res.json();
            })
            .then(res => {
                if (res['detail']) {
                    throw (res['detail']);
                }
                // addToast('Папка создана!', {
                //     appearance: 'success',
                //     autoDismiss: true,
                // });
                setSelectedFolder(res);
                setFolders([...folders, res].sort((a: I_Folder, b: I_Folder) => a.name < b.name ? -1 : 1))
            })
            .catch(error => {
                addToast('При создании папки произошла ошибка...', {
                    appearance: 'error',
                    autoDismiss: true,
                });
            });
    };

    const handleCreateClick = () => {
        createFolder(folderName, fgsId);
        handleClose();
    };

    const handleChange = (event: any) => {
        event.preventDefault();
        switch (event.target.id) {
            case 'name': {
                setFolderName(event.target.value);
                break;
            }
        }
    };

    return (
        <Dialog open={open}
                onClose={handleClose}
                aria-labelledby="confirmation-dialog-title">
            <DialogTitle id="confirmation-dialog-title">Добавление новой папки</DialogTitle>
            <DialogContent dividers>
                <TextField
                    autoFocus
                    variant="outlined"
                    margin="normal"
                    required
                    fullWidth
                    label="Название папки"
                    name="name"
                    id="name"
                    value={folderName}
                    onChange={handleChange}
                />
            </DialogContent>
            <DialogActions>
                <Button onClick={handleClose} color="primary">
                    Отмена
                </Button>
                <Button onClick={handleCreateClick} color="primary" disabled={!Boolean(folderName)}>
                    Добавить
                </Button>
            </DialogActions>
        </Dialog>
    )
};

export default AddFolderDialog;
