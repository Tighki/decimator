import React, {useEffect} from "react";
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
    setSelectedFolder: Function,
    selectedFolder: I_Folder | null
};

const EditFolderDialog = ({open, setOpen, fgsId, folders, setFolders, selectedFolder, setSelectedFolder}: OpenProp) => {
    const {addToast} = useToasts();

    const [folderName, setFolderName] = React.useState<string | undefined>(selectedFolder?.name);

    const handleClose = () => {
        setOpen(false);
    };

    useEffect(() => {
        setFolderName(selectedFolder?.name)
    }, [selectedFolder]);

    const updateFolder = (name?: string, fgId?: string) => {
        const headers = new Headers();

        let token = getToken()
        headers.append("Authorization", token);
        headers.append("Accept", 'application/json');

        const options = {
            method: 'PATCH',
            headers
        };

        const route = `http://${process.env.REACT_APP_API_URI}/api/v1/folders/${selectedFolder?._id}?new_name=${name}`;
        fetch(route, options)
            .then(res => {
                return res.json();
            })
            .then(res => {
                if (res['detail']) {
                    throw (res['detail']);
                }
                // addToast('Папка обновлена!', {
                //     appearance: 'success',
                //     autoDismiss: true,
                // });
                setSelectedFolder(res);
                const newFolders = folders.filter(folder => folder._id !== res._id)
                setFolders([...newFolders, res].sort((a: I_Folder, b: I_Folder) => a.name < b.name ? -1 : 1))
            })
            .catch(error => {
                addToast('При обновлении папки произошла ошибка...', {
                    appearance: 'error',
                    autoDismiss: true,
                });
            });
    };

    const handleCreateClick = () => {
        updateFolder(folderName, fgsId);
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
            <DialogTitle id="confirmation-dialog-title">Смена названия папки</DialogTitle>
            <DialogContent dividers>
                <TextField
                    autoFocus
                    variant="outlined"
                    margin="normal"
                    required
                    fullWidth
                    label="Новое название папки"
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
                    Изменить
                </Button>
            </DialogActions>
        </Dialog>
    )
};

export default EditFolderDialog;
