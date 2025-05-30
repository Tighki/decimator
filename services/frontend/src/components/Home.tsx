import React, {useEffect, useCallback} from "react";
import {makeStyles, Theme} from "@material-ui/core/styles";

import {useHistory} from "react-router-dom";
import {getToken} from "../utils/auth";
import {Backdrop, Container} from "@material-ui/core";
import Loader from "react-loader-spinner";
import {I_CurrentUser} from "../types/user";
import {useToasts} from "react-toast-notifications";
import MainAppBar from "./bars/MainAppBar";
import {I_Organization} from "../types/org";
import OrgAlbum from "./org/OrgAlbum";
import DrawerSideBar from "./bars/DrawerSideBar";
import DocumentsTable from "./org/table/DocumentsTable";
import {I_Document} from "../types/document";
import {I_Folder} from "../types/folder";


const useStyles = makeStyles((theme: Theme) => ({
    root: {
        height: '100%',
        display: 'flex',
        maxWidth: '100%',
        maxHeight: '100%',
        padding: '0px',
        margin: '0px',
    },
    content: {
        display: 'flex',
        height: '100%',
        maxWidth: '100%',
        maxHeight: '100%',
        padding: '0px',
        margin: '0px',
        paddingTop: '64px'
    },
    main: {
        display: 'flex',
        height: '100%',
        paddingTop: '14px',
        margin: '0px',
        maxWidth: '100%',
        maxHeight: '100%'
    },
    backdrop: {
        zIndex: theme.zIndex.drawer + 1,
    },
}));

const HomePage = () => {
    const classes = useStyles();
    const {addToast} = useToasts();
    const history = useHistory();

    const [pending, setPending] = React.useState<boolean>(false);
    const [currentUser, setCurrentUser] = React.useState<I_CurrentUser | null>(null);
    const [selectedOrg, setSelectedOrg] = React.useState<I_Organization | null>(null);
    // @ts-ignore
    const [selectedFgsId, setSelectedFgsId] = React.useState<string>(localStorage.getItem('last_fgs_id'));
    const [selectedFolder, setSelectedFolder] = React.useState<I_Folder | null>(null);
    const [folders, setFolders] = React.useState<I_Folder[]>([]);
    const [documents, setDocuments] = React.useState<I_Document[]>([]);

    const getCurrentUser = useCallback(() => {
        const headers = new Headers();
        let token = getToken()
        headers.append("Authorization", token);
        headers.append("Accept", "application/json");

        const options = {
            method: 'GET',
            headers
        };
        const route = `http://${process.env.REACT_APP_API_URI}/api/v1/users/me`;
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
                // addToast('Данные текущего пользователя получены!', {
                //     appearance: 'success',
                //     autoDismiss: true,
                // });
                setCurrentUser({...res});
            })
            .catch(error => {
                addToast('Не удалось загрузить данные...', {
                    appearance: 'error',
                    autoDismiss: true,
                });
                localStorage.removeItem('current_user');
                history.push('/login');
            });
    }, [history, addToast, setPending]);

    const fetchDocuments = useCallback((folderId: string | undefined) => {
        const headers = new Headers();
        let token = getToken()
        headers.append("Authorization", token);
        headers.append("Accept", "application/json");

        const options = {
            method: 'GET',
            headers
        };
        const route = `http://${process.env.REACT_APP_API_URI}/api/v1/documents/?folder_id=${folderId}`;
        return fetch(route, options)
            .then(res => {
                return res.json();
            })
            .then(res => {
                if (res['detail']) {
                    throw (res['detail']);
                }
                // addToast('Документы получены!', {
                //     appearance: 'success',
                //     autoDismiss: true,
                // });
                setDocuments(res);
            })
            .catch(error => {
                addToast('Не удалось загрузить документы...', {
                    appearance: 'error',
                    autoDismiss: true,
                });
            });
    }, [addToast]);

    const fetchFolders = (fgsId: string | null) => {
        const headers = new Headers();

        let token = getToken()
        headers.append("Authorization", token);
        headers.append("Accept", 'application/json');

        const options = {
            method: 'GET',
            headers
        };

        const route = `http://${process.env.REACT_APP_API_URI}/api/v1/folders/${fgsId}`;
        fetch(route, options)
            .then(res => {
                return res.json();
            })
            .then(res => {
                if (res['detail']) {
                    throw (res['detail']);
                }
                // addToast('Список папок загружен!', {
                //     appearance: 'success',
                //     autoDismiss: true,
                // });
                setFolders(res);
            })
            .catch(error => {
                addToast('При загрузке списка папок произошла ошибка...', {
                    appearance: 'error',
                    autoDismiss: true,
                });
            });
    };

    const reFetchFolders = () => {
        fetchFolders(selectedFgsId);
    };

    useEffect(() => {
        getCurrentUser();
    }, [getCurrentUser]);

    useEffect(() => {
        if (Boolean(selectedFolder)) {
            fetchDocuments(selectedFolder?._id)
        }
    }, [selectedFolder, fetchDocuments]);

    // useEffect(() => {
    //     reFetchFolders();
    // }, [selectedFgsId]);

    return (
        <div className={classes.root}>
            <MainAppBar currentUser={currentUser} selectedOrg={selectedOrg}/>
            <Container className={classes.content}>
                {Boolean(selectedOrg) &&
                <DrawerSideBar selectedOrg={selectedOrg}
                               setSelectedOrg={setSelectedOrg}
                               selectedFolder={selectedFolder}
                               setSelectedFolder={setSelectedFolder}
                               currentUser={currentUser}
                               setDocuments={setDocuments}
                               folders={folders}
                               setFolders={setFolders}
                               fetchFolders={fetchFolders}
                               selectedFgsId={selectedFgsId}
                               setSelectedFgsId={setSelectedFgsId}
                />
                }
                <Container className={classes.main}>
                    {!Boolean(selectedOrg) &&
                    <OrgAlbum currentUser={currentUser} setPending={setPending} setSelectedOrg={setSelectedOrg}/>}
                    {Boolean(selectedOrg) && Boolean(selectedFolder) &&
                    <DocumentsTable documents={documents}
                                    setDocuments={setDocuments}
                                    selectedFolder={selectedFolder}
                                    currentUser={currentUser}
                                    setSelectedFolder={setSelectedFolder}
                                    selectedOrg={selectedOrg}
                                    reFetchFolders={reFetchFolders}
                    />
                    }
                </Container>
            </Container>
            <Backdrop open={pending} className={classes.backdrop}>
                <Loader type="Audio" color="#ffffff" height={100} width={100}/>
            </Backdrop>
        </div>
    )
};

export default HomePage;
