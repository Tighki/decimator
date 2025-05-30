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
import {I_Folder, I_Reserve} from "../../../types/folder";
import {getToken} from "../../../utils/auth";
import {useToasts} from "react-toast-notifications";
import {I_CurrentUser} from "../../../types/user";

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

const suggest_number = (docs: I_Document[] | null, reserves?: I_Reserve[]) => {
    let num = 0;
    const BreakException = {};
    try {
        docs?.forEach((doc) => {
            const existed = docs?.filter((doc_) => doc_.number === doc.number + 1)
            if (existed.length) {
                return;
            }
            num = doc.number + 1;
            throw BreakException;
        })
    } catch (e) {
        if (e !== BreakException) throw e;
    }
    return num;
};


type AddDocumentProp = {
    open: boolean
    setOpen: Function
    documents: I_Document[] | null
    setDocuments: Function
    selectedFolder: I_Folder | null
    currentUser: I_CurrentUser | null
};

const AddDocumentDialog = ({open, setOpen, currentUser, selectedFolder, documents, setDocuments}: AddDocumentProp) => {
    const classes = useStyles();
    const {addToast} = useToasts();

    const [project, setProject] = React.useState<string>('');
    const [comment, setComment] = React.useState<string>('');
    const [number, setNumber] = React.useState<number | string>('');
    const [version, setVersion] = React.useState<number | string | null>('');

    useEffect(() => {
        const auto_number = suggest_number(documents, selectedFolder?.reserves)
        setNumber(auto_number);
    }, [documents, selectedFolder]);


    const createNewDocument = (data: any) => {
        const headers = new Headers();

        let token = getToken()
        headers.append("Authorization", token);
        headers.append("Accept", 'application/json');
        headers.append("Content-Type", 'application/json');

        const options = {
            method: 'POST',
            body: JSON.stringify(data),
            headers
        };

        const route = `http://${process.env.REACT_APP_API_URI}/api/v1/documents`;
        fetch(route, options)
            .then(res => {
                if (!res.ok) {
                    return res.json().then(data => {
                        throw new Error(data.detail || 'Ошибка сервера');
                    });
                }
                return res.json();
            })
            .then(res => {
                if (res['detail']) {
                    throw new Error(res['detail']);
                }
                // addToast('Документ создан!', {
                //     appearance: 'success',
                //     autoDismiss: true,
                // });
                // @ts-ignore
                setDocuments([...documents, res].sort((a: I_Document, b: I_Document) => a.number < b.number ? -1 : 1))
            })
            .catch(error => {
                console.error('Ошибка при создании документа:', error);
                addToast(`При создании документа произошла ошибка: ${error.message || ''}`, {
                    appearance: 'error',
                    autoDismiss: true,
                });
            });
    };

    const handleClose = () => {
        setOpen(false);
        setProject('');
        setComment('');
        setVersion('');
    };

    const handleCreateNew = () => {
        if (comment === '') {
            addToast('Комментарий не может быть пустым...', {
                appearance: 'error',
                autoDismiss: true,
            });
            return
        }
        if (number === '') {
            addToast('Номер не может быть пустым...', {
                appearance: 'error',
                autoDismiss: true,
            });
            return
        }
        
        // Преобразуем version в строку или пустую строку, если он пустой или null
        const versionStr = version === null || version === '' ? '' : String(version);
        
        const documentData = {
            folderId: selectedFolder?._id,
            comment,
            number: parseInt(number.toString()),
            authorId: currentUser?._id,
            version: versionStr,
            project: project || ''
        };
        
        createNewDocument(documentData);
        handleClose();
    };

    const handleChange = (event: any) => {
        event.preventDefault();

        switch (event.target.id) {
            case 'project': {
                setProject(event.target.value);
                break;
            }
            case 'comment': {
                setComment(event.target.value);
                break;
            }
            case 'number': {
                setNumber(event.target.value);
                break;
            }
            case 'version': {
                setVersion(event.target.value);
                break;
            }
        }
    };

    return (
        <Dialog disableBackdropClick open={open} onClose={handleClose} aria-labelledby="form-dialog-title">
            <DialogTitle id="form-dialog-title">Регистрация документа</DialogTitle>
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
                        onChange={handleChange}
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
                        onChange={handleChange}
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
                        onChange={handleChange}
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
                        onChange={handleChange}
                    />
                </FormControl>
            </DialogContent>
            <DialogActions>
                <Button onClick={handleClose} color="primary">
                    Отмена
                </Button>
                <Button onClick={handleCreateNew} color="primary" type='submit' form='docForm'>
                    Создать
                </Button>
            </DialogActions>
        </Dialog>
    )
};

export default AddDocumentDialog;
