import React from "react";
import {Button, Dialog, DialogActions, DialogContent, DialogTitle, Typography} from "@material-ui/core";
import {getToken} from "../../../utils/auth";
import {I_Folder} from "../../../types/folder";
import {useToasts} from "react-toast-notifications";
import {I_Document} from "../../../types/document";


type OpenProp = {
    open: boolean
    setOpen: Function
    docToDeleteId: any
    setDocToDelete: Function
    documents: I_Document[] | null
    setDocuments: Function
};

const DeleteDocDialog = ({open, setOpen, docToDeleteId, setDocToDelete, documents, setDocuments}: OpenProp) => {
    const {addToast} = useToasts();

    const handleClose = () => {
        setOpen(false);
        setDocToDelete('')
    };

    const handleDeleteClick = () => {
        deleteDocument(docToDeleteId);
        handleClose();
    };

    const deleteDocument = (docId: string) => {
        const headers = new Headers();

        let token = getToken()
        headers.append("Authorization", token);
        headers.append("Accept", 'application/json');

        const options = {
            method: 'DELETE',
            headers
        };

        const route = `http://${process.env.REACT_APP_API_URI}/api/v1/documents/${docId}`;
        fetch(route, options)
            .then(res => {
                return res.json();
            })
            .then(res => {
                if (res['detail']) {
                    throw (res['detail']);
                }
                // addToast('Документ удален!', {
                //     appearance: 'success',
                //     autoDismiss: true,
                // });
                setDocuments(documents?.filter((doc: I_Document) => doc._id !== docId));
            })
            .catch(error => {
                addToast('При удалении документа произошла ошибка...', {
                    appearance: 'error',
                    autoDismiss: true,
                });
            });
    };

    return (
        <Dialog open={open}
                onClose={handleClose}
                aria-labelledby="confirmation-dialog-title">
            <DialogTitle id="confirmation-dialog-title">Удаление документа</DialogTitle>
            <DialogContent dividers>
                <Typography variant="h6" gutterBottom>
                    ВНИМАНИЕ!!!
                </Typography>
                <br/>
                <Typography>
                    Вы уверены что хотите удалить этот документ?
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

export default DeleteDocDialog;
