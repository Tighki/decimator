import React, {useEffect} from "react";
import {
    Button,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    FormControl,
    makeStyles,
    TextField
} from "@material-ui/core";
import {I_Document} from "../../../types/document";

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
        width: '100%',
        minWidth: '500px',
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
    }
}));


type DocumentInfoProp = {
    open: boolean
    setOpen: Function
    currentDocument: I_Document | null
};

const DocumentInfoDialog = ({open, setOpen, currentDocument}: DocumentInfoProp) => {
    const classes = useStyles();

    const [project, setProject] = React.useState<string | undefined>('');
    const [comment, setComment] = React.useState<string | undefined>('');
    const [number, setNumber] = React.useState<number | string | undefined>('');
    const [version, setVersion] = React.useState<number | string | null | undefined>('');

    useEffect(() => {
        setProject(currentDocument?.project === null ? '' : currentDocument?.project);
        setComment(currentDocument?.comment === null ? '' : currentDocument?.comment);
        setNumber(currentDocument?.number === null ? '' : currentDocument?.number);
        setVersion(currentDocument?.version === null ? '' : currentDocument?.version);
    }, [currentDocument]);

    const handleClose = () => {
        setOpen(false);
    };

    return (
        <Dialog disableBackdropClick open={open} onClose={handleClose} aria-labelledby="form-dialog-title">
            <DialogTitle id="form-dialog-title">Информация о документе</DialogTitle>
            <DialogContent>
                <FormControl className={classes.form} id='docForm'>
                    <TextField
                        autoFocus
                        variant="outlined"
                        margin="normal"
                        fullWidth
                        label="Проект"
                        name="project"
                        id="project"
                        value={project}
                    />
                    <TextField
                        type="text"
                        rows={4}
                        variant="outlined"
                        margin="normal"
                        fullWidth
                        required
                        multiline
                        label="Комментарий"
                        name="comment"
                        id="comment"
                        value={comment}
                    />
                    <TextField
                        className={classes.number}
                        type="number"
                        variant="outlined"
                        margin="normal"
                        required
                        fullWidth
                        label="Порядковый номер"
                        name="number"
                        id="number"
                        value={number}
                    />
                    <TextField
                        className={classes.number}
                        type="folderName"
                        variant="outlined"
                        margin="normal"
                        fullWidth
                        label="Номер исполнения"
                        name="version"
                        id="version"
                        value={version}
                    />
                </FormControl>
            </DialogContent>
            <DialogActions>
                <Button onClick={handleClose} color="primary">
                    Закрыть
                </Button>
            </DialogActions>
        </Dialog>
    )
};

export default DocumentInfoDialog;
