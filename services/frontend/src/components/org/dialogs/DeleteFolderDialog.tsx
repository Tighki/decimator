import React from "react";
import {Button, Dialog, DialogActions, DialogContent, DialogTitle, Typography} from "@material-ui/core";
import {useToasts} from "react-toast-notifications";
import {getToken} from "../../../utils/auth";
import {I_Folder} from "../../../types/folder";

type OpenProp = {
    open: boolean
    setOpen: Function
    folders: I_Folder[] | null
    setFolders: Function
    setDocuments: Function
    folderId?: string
    setSelectedFolder: Function
};

const DeleteFolderDialog = ({
                                open,
                                setOpen,
                                folderId,
                                folders,
                                setFolders,
                                setDocuments,
                                setSelectedFolder
                            }: OpenProp) => {
    const {addToast} = useToasts();

    const handleClose = () => {
        setOpen(false);
    };

    const deleteFolderWithDocuments = () => {
        const headers = new Headers();

        let token = getToken()
        headers.append("Authorization", token);
        headers.append("Accept", 'application/json');

        const options = {
            method: 'DELETE',
            headers
        };

        const route = `http://${process.env.REACT_APP_API_URI}/api/v1/folders/${folderId}`;
        fetch(route, options)
            .then(res => {
                return res.json();
            })
            .then(res => {
                if (res['detail']) {
                    throw (res['detail']);
                }
                // addToast('Папка удалена!', {
                //     appearance: 'success',
                //     autoDismiss: true,
                // });
                setDocuments([]);
                setSelectedFolder(null);
                setFolders(folders?.filter((folder: I_Folder) => folder._id !== folderId));
            })
            .catch(error => {
                addToast('При удалении папки произошла ошибка...', {
                    appearance: 'error',
                    autoDismiss: true,
                });
            });
    };

    const handleDeleteClick = () => {
        deleteFolderWithDocuments();
        handleClose();
    };


    return (
        <Dialog open={open}
                onClose={handleClose}
                aria-labelledby="confirmation-dialog-title">
            <DialogTitle id="confirmation-dialog-title">Удаление папки</DialogTitle>
            <DialogContent dividers>
                <Typography variant="h6" gutterBottom>
                    ВНИМАНИЕ!!!
                </Typography>
                <br/>
                <Typography>
                    Вы уверены что хотите удалить эту папку?
                </Typography>
                <br/>
                <Typography color='secondary'>
                    Отменить операцию НЕВОЗМОЖНО!!!
                </Typography>
                <br/>
                <br/>
            </DialogContent>
            <DialogActions>
                <Button onClick={handleClose} color="primary">
                    Отмена
                </Button>
                <Button onClick={handleDeleteClick} color="secondary">
                    Удалить
                </Button>
            </DialogActions>
        </Dialog>
    )
};

export default DeleteFolderDialog;
