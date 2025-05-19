import React from "react";
import {Button, Dialog, DialogActions, DialogContent, DialogTitle, Typography} from "@material-ui/core";

type OpenProp = {
    open: boolean
    setOpen: Function
    deleteReserve: Function
    reserveIdToDelete: string
};

const DeleteReserveDialog = ({open, setOpen, deleteReserve, reserveIdToDelete}: OpenProp) => {

    const handleClose = () => {
        setOpen(false);
    };

    const handleDeleteClick = () => {
        deleteReserve(reserveIdToDelete);
        handleClose();
    };


    return (
        <Dialog open={open}
                onClose={handleClose}
                aria-labelledby="confirmation-dialog-title">
            <DialogTitle id="confirmation-dialog-title">Удаление резерва</DialogTitle>
            <DialogContent dividers>
                <Typography variant="h6" gutterBottom>
                    ВНИМАНИЕ!!!
                </Typography>
                <br/>
                <Typography>
                    Вы уверены что хотите удалить этот резерв?
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

export default DeleteReserveDialog;
