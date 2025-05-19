import React, {useEffect} from "react";
import Card from "@material-ui/core/Card";
import CardActionArea from "@material-ui/core/CardActionArea";
import CardContent from "@material-ui/core/CardContent";
import Grid from "@material-ui/core/Grid";
import Typography from "@material-ui/core/Typography";
import {makeStyles} from "@material-ui/core/styles";
import Container from "@material-ui/core/Container";
import SettingsBackupRestoreRoundedIcon from "@material-ui/icons/SettingsBackupRestoreRounded";
import {AddCircleRounded} from "@material-ui/icons";
import DeleteIcon from "@material-ui/icons/Delete";
import SettingsIcon from "@material-ui/icons/Settings";
import {CardActions, CardMedia, IconButton} from "@material-ui/core";
import OrgPhoneIcon from "./icons/OrgPhoneIcon";
import OrgInfoIcon from "./icons/OrgInfoIcon";
import OrgAddressIcon from "./icons/OrgAddressIcon";
import {useToasts} from "react-toast-notifications";
import {I_Organization} from "../../types/org";
import {I_CurrentUser} from "../../types/user";
import CreateOrgDialog from "./dialogs/CreateOrgDialog";
import {getToken} from "../../utils/auth";
import OrgSettingsDialog from "./settings/OrgSettingsDialog";

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
    inactiveOrg: {
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: '#ee6868'
    },
    cardAdd: {
        height: '135px',
        backgroundColor: '#efefef',
        display: 'flex',
        flexDirection: 'column',
    },
    cardContent: {
        flexGrow: 1,
    },
    cardContentAdd: {
        width: '100%',
        height: '100px',
    },
    cardIcons: {
        width: '100%',
        display: 'flex',
        justifyContent: 'space-between'
    },
    media: {
        height: 140,
    },
}));

type OrgAlbumProps = {
    currentUser: null | I_CurrentUser
    setPending: Function
    setSelectedOrg: Function
};

const OrgAlbum = ({currentUser, setPending, setSelectedOrg}: OrgAlbumProps) => {
    const classes = useStyles();
    const {addToast} = useToasts();

    const [orgs, setOrgs] = React.useState<I_Organization[]>([]);
    const [openCreateOrgDialog, setOpenCreateOrgDialog] = React.useState<boolean>(false);
    const [openSettingsOrgDialog, setOpenSettingsOrgDialog] = React.useState<boolean>(false);
    const [orgToSettings, setOrgToSettings] = React.useState<I_Organization | null>(null);

    const onOrgCreated = (new_org: I_Organization) => {
        setOrgs([...orgs, new_org]);
    };

    const getUserOrgs = () => {
        const headers = new Headers();

        let token = getToken()
        headers.append("Authorization", token);
        headers.append("Accept", 'application/json');

        const options = {
            method: 'GET',
            headers
        };

        const route = `http://${process.env.REACT_APP_API_URI}/api/v1/orgs/`;
        setPending(true);
        fetch(route, options)
            .then(res => {
                setPending(false);
                return res.json();
            })
            .then(res => {
                if (res['detail']) {
                    throw (res['detail']);
                }
                // addToast('Список доступных организаций загружен!', {
                //     appearance: 'success',
                //     autoDismiss: true,
                // });
                setOrgs(res);
            })
            .catch(() => {
                addToast('При загрузке списка организаций произошла ошибка...', {
                    appearance: 'error',
                    autoDismiss: true,
                });
            });
    };

    const deleteOrg = (org_id: string) => {
        const headers = new Headers();

        let token = getToken()
        headers.append("Authorization", token);
        headers.append("Accept", 'application/json');

        const options = {
            method: 'DELETE',
            headers
        };

        const route = `http://${process.env.REACT_APP_API_URI}/api/v1/orgs/${org_id}`;
        setPending(true);
        fetch(route, options)
            .then(res => {
                setPending(false);
                return res.json();
            })
            .then(res => {
                if (res['detail']) {
                    throw (res['detail']);
                }
                // addToast('Организация удалена', {
                //     appearance: 'success',
                //     autoDismiss: true,
                // });
                setOrgs(res);
            })
            .catch(() => {
                addToast('При попытке удалить организацию произошла ошибка', {
                    appearance: 'error',
                    autoDismiss: true,
                });
            });
    };

    const restoreOrg = (org_id: string) => {
        const headers = new Headers();

        let token = getToken()
        headers.append("Authorization", token);
        headers.append("Accept", 'application/json');

        const options = {
            method: 'PATCH',
            headers
        };

        const route = `http://${process.env.REACT_APP_API_URI}/api/v1/orgs/${org_id}/restore`;
        setPending(true);
        fetch(route, options)
            .then(res => {
                setPending(false);
                return res.json();
            })
            .then(res => {
                if (res['detail']) {
                    throw (res['detail']);
                }
                // addToast('Организация восстановлена', {
                //     appearance: 'success',
                //     autoDismiss: true,
                // });
                setOrgs(res);
            })
            .catch(() => {
                addToast('При попытке восставновить организацию произошла ошибка', {
                    appearance: 'error',
                    autoDismiss: true,
                });
            });
    };

    useEffect(() => {
        getUserOrgs();
    }, []);

    const onOpenCreateOrgDialogButtonClicked = (event: any) => {
        event.preventDefault();
        setOpenCreateOrgDialog(true);
    };

    const onOrgDeleteClicked = (event: any, org_id: string) => {
        event.preventDefault();
        deleteOrg(org_id);
    };

    const onOrgCardClicked = (event: any, org: I_Organization) => {
        event.preventDefault();
        setSelectedOrg(org);
    };

    const onOrgRestoreClicked = (event: any, org_id: string) => {
        event.preventDefault();
        restoreOrg(org_id);
    };

    const updateOrgUsers = (orgId: string, newData: I_Organization) => {
        const updated_org = orgs.find(o => o._id === orgId);
        // @ts-ignore
        updated_org.canWrite = newData.canWrite;
        // @ts-ignore
        updated_org.canRead = newData.canRead;
    };

    return (
        <Container className={classes.cardGrid} maxWidth="md">
            <Grid container spacing={4}>
                {orgs?.map((org) => (
                    <Grid item key={org._id} xs={12} sm={6} md={4}>
                        <Card className={org.isActive ? classes.card : classes.inactiveOrg}>
                            <CardActionArea onClick={event => {
                                onOrgCardClicked(event, org)
                            }}>
                                <CardMedia
                                    className={classes.media}
                                    image="/bp_org_card_media.png"
                                    title="Организация"
                                />
                                <CardContent className={classes.cardContent}>
                                    <Typography gutterBottom variant="h5" component="h2">
                                        {org.code}
                                    </Typography>
                                    <Typography variant="overline" color="textSecondary" gutterBottom display="block">
                                        {org.name}
                                    </Typography>
                                </CardContent>
                            </CardActionArea>
                            <CardActions>
                                <div className={classes.cardIcons}>
                                    <div>
                                        <OrgPhoneIcon orgPhone={org.phone}/>
                                        <OrgAddressIcon orgAddress={org.address}/>
                                        <OrgInfoIcon orgInfo={org.description}/>
                                    </div>
                                    {currentUser?.isSuper && <div>
                                        <IconButton aria-label="settings"
                                                    size="small"
                                                    color="primary"
                                                    onClick={() => {
                                                        setOrgToSettings(org)
                                                        setOpenSettingsOrgDialog(true)
                                                    }}
                                        >
                                            <SettingsIcon/>
                                        </IconButton>
                                        {org.isActive &&
                                        <IconButton aria-label="delete"
                                                    size="small"
                                                    color='secondary'
                                                    onClick={(e) => {
                                                        onOrgDeleteClicked(e, org._id)
                                                    }}>
                                            <DeleteIcon/>
                                        </IconButton>
                                        }
                                        {!org.isActive &&
                                        <IconButton aria-label="restore"
                                                    size="small"
                                                    color='primary'
                                                    onClick={(e) => {
                                                        onOrgRestoreClicked(e, org._id)
                                                    }}>
                                            <SettingsBackupRestoreRoundedIcon/>
                                        </IconButton>
                                        }
                                    </div>}
                                </div>
                            </CardActions>
                        </Card>
                    </Grid>
                ))}
                {currentUser?.isSuper &&
                <Grid item key="add_placeholder" xs={12} sm={6} md={4}>
                    <Card className={classes.cardAdd}>
                        <CardActionArea onClick={onOpenCreateOrgDialogButtonClicked}>
                            <CardContent className={classes.cardContent}>
                                <AddCircleRounded className={classes.cardContentAdd} color="disabled"/>
                            </CardContent>
                        </CardActionArea>
                    </Card>
                </Grid>
                }
            </Grid>
            <CreateOrgDialog open={openCreateOrgDialog}
                             setOpen={setOpenCreateOrgDialog}
                             setPending={setPending}
                             onOrgCreated={onOrgCreated}
            />
            <OrgSettingsDialog open={openSettingsOrgDialog}
                               setOpen={setOpenSettingsOrgDialog}
                               org={orgToSettings}
                               setOrgs={setOrgs}
                               setPending={setPending}
                               updateOrgUsers={updateOrgUsers}
            />
        </Container>
    );
}

export default OrgAlbum;
