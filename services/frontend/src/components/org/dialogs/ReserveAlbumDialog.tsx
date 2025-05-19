import React from 'react';
import {createStyles, makeStyles, Theme} from '@material-ui/core/styles';
import Button from '@material-ui/core/Button';
import Dialog from '@material-ui/core/Dialog';
import AppBar from '@material-ui/core/AppBar';
import Toolbar from '@material-ui/core/Toolbar';
import Typography from '@material-ui/core/Typography';
import Slide from '@material-ui/core/Slide';
import {TransitionProps} from '@material-ui/core/transitions';
import ReserveAlbum from "../table/ReserveAlbum";
import CreateNewReserveDialog from "./CreateNewReserveDialog";
import {I_Folder} from "../../../types/folder";
import {I_CurrentUser} from "../../../types/user";
import {I_Document} from "../../../types/document";
import {I_Organization} from "../../../types/org";

const useStyles = makeStyles((theme: Theme) =>
    createStyles({
        appBar: {
            position: 'relative',
        },
        title: {
            marginLeft: theme.spacing(2),
            flex: 1,
        },
        exitButton: {
            marginRight: theme.spacing(2)
        }
    }),
);

const Transition = React.forwardRef(function Transition(
    props: TransitionProps & { children?: React.ReactElement },
    ref: React.Ref<unknown>,
) {
    return <Slide direction="up" ref={ref} {...props} />;
});

type OpenProp = {
    open: boolean
    setOpen: Function
    reFetchFolders: Function
    selectedOrg: I_Organization | null
    selectedFolder: I_Folder | null
    setSelectedFolder: Function
    currentUser: I_CurrentUser | null
    documents: I_Document[] | null
};

const ReserveAlbumDialog = ({open, setOpen, reFetchFolders, documents, currentUser, selectedFolder, setSelectedFolder, selectedOrg}: OpenProp) => {
    const classes = useStyles();
    const [openCreateReserveDialog, setOpenCreateReserveDialog] = React.useState<boolean>(false);

    const onOpenCreateReserveDialogButtonClicked = (event: any) => {
        event.preventDefault();
        setOpenCreateReserveDialog(true)
    };

    const handleClose = () => {
        setOpen(false);
    };

    return (
        <Dialog fullScreen open={open} onClose={handleClose} TransitionComponent={Transition}>
            <AppBar className={classes.appBar}>
                <Toolbar>
                    <Typography variant="h6" className={classes.title}>
                        Резервирование порядковых номеров
                    </Typography>
                    <Button variant='contained'
                            color="secondary"
                            onClick={handleClose}
                            className={classes.exitButton}
                    >
                        Выйти
                    </Button>
                    {(selectedOrg?.canWrite.includes(currentUser?._id as string) || currentUser?.isSuper) &&
                        <Button variant="contained"
                                autoFocus
                                color="default"
                                onClick={onOpenCreateReserveDialogButtonClicked}
                        >
                            Создать новый
                        </Button>
                    }
                </Toolbar>
            </AppBar>
            <ReserveAlbum selectedFolder={selectedFolder}
                          documents={documents}
                          currentUser={currentUser}
                          setSelectedFolder={setSelectedFolder}
                          selectedOrg={selectedOrg}
                          reFetchFolders={reFetchFolders}
            />
            <CreateNewReserveDialog open={openCreateReserveDialog}
                                    setOpen={setOpenCreateReserveDialog}
                                    selectedFolder={selectedFolder}
                                    currentUser={currentUser}
                                    setSelectedFolder={setSelectedFolder}
                                    reFetchFolders={reFetchFolders}
            />
        </Dialog>
    );
}

export default ReserveAlbumDialog;
