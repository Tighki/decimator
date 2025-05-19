import React, {useEffect} from 'react';
import Card from '@material-ui/core/Card';
import CardActionArea from '@material-ui/core/CardActionArea';
import CardContent from '@material-ui/core/CardContent';
import Grid from '@material-ui/core/Grid';
import Typography from '@material-ui/core/Typography';
import {makeStyles} from '@material-ui/core/styles';
import Container from '@material-ui/core/Container';
import DeleteIcon from "@material-ui/icons/Delete"
import {Backdrop, CardActions, CircularProgress, IconButton} from "@material-ui/core";
import {capitalizeFirstLetter} from "../../../utils/common";
import {I_CurrentUser, I_UserFullName} from "../../../types/user";
import {I_Folder} from "../../../types/folder";
import {I_Document} from "../../../types/document";
import {getToken} from "../../../utils/auth";
import {useToasts} from "react-toast-notifications";
import {I_Organization} from "../../../types/org";
import DeleteReserveDialog from "../dialogs/DeleteReserveDialog";

const useStyles = makeStyles((theme) => ({
    cardGrid: {
        paddingTop: theme.spacing(8),
        paddingBottom: theme.spacing(8),
    },
    card: {
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
    },
    cardContent: {
        flexGrow: 1,
    },
    card_icons: {
        width: '100%',
        display: 'flex',
        justifyContent: 'space-between'
    },
    backdrop: {
        zIndex: theme.zIndex.drawer + 1,
        color: '#fff',
    },
    media: {
        height: 140,
    },
}));

type ReserveAlbumProp = {
    selectedFolder: I_Folder | null
    setSelectedFolder: Function
    reFetchFolders: Function
    documents: I_Document[] | null
    currentUser: I_CurrentUser | null
    selectedOrg: I_Organization | null
};

const ReserveAlbum = ({selectedFolder, documents, currentUser, setSelectedFolder, selectedOrg, reFetchFolders}: ReserveAlbumProp) => {
    const classes = useStyles();
    const {addToast} = useToasts();
    const [deleteReserveDialogOpen, setDeleteReserveDialogOpen] = React.useState<boolean>(false);
    const [reserveIdToDelete, setReserveIdToDelete] = React.useState<string>('');

    const deleteReserve = (reserveId: string) => {
        setReserveIdToDelete('');
        const headers = new Headers();

        let token = getToken()
        headers.append("Authorization", token);
        headers.append("Accept", 'application/json');

        const options = {
            method: 'DELETE',
            headers
        };

        const route = `http://${process.env.REACT_APP_API_URI}/api/v1/folders/${selectedFolder?._id}/reserves/${reserveId}`;
        fetch(route, options)
            .then(res => {
                return res.json();
            })
            .then(res => {
                if (res['detail']) {
                    throw (res['detail']);
                }
                // addToast('Резерв удален!', {
                //     appearance: 'success',
                //     autoDismiss: true,
                // });
                setSelectedFolder(res);
                reFetchFolders();
            })
            .catch(error => {
                addToast('При удалении резерва произошла ошибка...', {
                    appearance: 'error',
                    autoDismiss: true,
                });
            });
    };

    const onCardClicked = (event: any, org_id: string) => {
        event.preventDefault();
        // dispatch(OrgThunks.fetchOrganizationData(org_id))
    };

    const getAuthorName = (author: I_UserFullName) => {
        const fn = capitalizeFirstLetter(author.firstName).charAt(0);
        const sn = capitalizeFirstLetter(author.secondName).charAt(0);
        const ln = capitalizeFirstLetter(author.lastName);
        return `${ln} ${fn}. ${sn}.`
    };

    const getDate = (date_str: string) => {
        let date = new Date(Date.parse(date_str));
        let day = date.getDate();
        let month = date.getMonth();
        let year = date.getFullYear();
        return ('0' + day).slice(-2) + '.' + ('0' + (month + 1)).slice(-2) + '.' + year
    };

    return (
        <Container className={classes.cardGrid} maxWidth="md">
            <Grid container spacing={4}>
                {selectedFolder?.reserves.map((reserve) => (
                    <Grid item key={reserve.id} xs={12} sm={6} md={4}>
                        <Card className={classes.card}>
                            <CardActionArea onClick={event => {
                                onCardClicked(event, reserve.id)
                            }}>
                                <CardContent className={classes.cardContent}>
                                    <Typography gutterBottom variant="h5" component="h2">
                                        С: {reserve.from_}
                                    </Typography>
                                    <Typography gutterBottom variant="h5" component="h2">
                                        По: {reserve.to_}
                                    </Typography>
                                    <Typography variant="overline" color="textSecondary" noWrap display="block">
                                        {reserve.description}
                                    </Typography>
                                </CardContent>
                            </CardActionArea>
                            <CardActions>
                                <div className={classes.card_icons}>
                                    <Typography variant="caption" color="textSecondary" display="block">
                                        {getAuthorName(reserve.authorFullName)}
                                    </Typography>
                                    <Typography variant="caption" color="textSecondary" display="block">
                                        {getDate(reserve.created)}
                                    </Typography>
                                    {(currentUser?.isSuper || ((currentUser?._id === reserve.authorId) &&
                                        selectedOrg?.canWrite.includes(currentUser?._id as string)
                                        )) &&
                                        <IconButton aria-label="delete"
                                        size="small"
                                        color='secondary'
                                        onClick={() => {
                                            setReserveIdToDelete(reserve.id);
                                            setDeleteReserveDialogOpen(true);
                                    }}>
                                        <DeleteIcon/>
                                        </IconButton>
                                    }
                                </div>
                            </CardActions>
                        </Card>
                    </Grid>
                ))}
            </Grid>
            <DeleteReserveDialog open={deleteReserveDialogOpen}
                                 setOpen={setDeleteReserveDialogOpen}
                                 deleteReserve={deleteReserve}
                                 reserveIdToDelete={reserveIdToDelete}
                                 />
        </Container>
    );
}

export default ReserveAlbum;
