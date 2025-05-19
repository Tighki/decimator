import {createStyles, makeStyles, Theme} from "@material-ui/core/styles";
import React, {useEffect} from "react";
import {TransitionProps} from "@material-ui/core/transitions";
import Slide from "@material-ui/core/Slide";
import Dialog from "@material-ui/core/Dialog";
import AppBar from "@material-ui/core/AppBar";
import Toolbar from "@material-ui/core/Toolbar";
import IconButton from "@material-ui/core/IconButton";
import CloseIcon from "@material-ui/icons/Close";
import Typography from "@material-ui/core/Typography";
import {Box, Container, Tab, Tabs} from "@material-ui/core";
import {I_Organization} from "../../../types/org";
import OrgInfoForm from "./OrgInfoForm";
import OrgUsersManager from "./OrgUsersManager";
import OrgFolderGroups from "./OrgFolderGroups";

interface TabPanelProps {
    children?: React.ReactNode
    index: any
    value: any
}

const TabPanel = (props: TabPanelProps) => {
    const {children, value, index, ...other} = props
    return (
        <div role="tabpanel"
             hidden={value !== index}
             id={`simple-tabpanel-${index}`}
             aria-labelledby={`simple-tab-${index}`}
             {...other}
        >
            {
                value === index && (
                    <Box p={3}>
                        {children}
                    </Box>
                )
            }
        </div>
    );
};

const allyProps = (index: any) => {
    return {
        id: `simple-tqb-${index}`,
        'aria-controls': `simple-tabpanel-${index}`,
    }
}

const useStyles = makeStyles((theme: Theme) =>
    createStyles({
        appBar: {
            position: 'relative',
            display: 'flex'
        },
        mainBody: {
            display: 'flex',
            flexGrow: 1,
            height: 224,
            backgroundColor: theme.palette.background.paper,
        },
        tabs: {
            borderRight: `1px solid ${theme.palette.divider}`,
        },
        title: {
            marginLeft: theme.spacing(2),
            flex: 1,
        },
        form: {
            width: '100%', // Fix IE 11 issue.
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
        },
        phone_and_code: {
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
        },
    }),
);

const Transition = React.forwardRef(function Transition(
    props: TransitionProps & { children?: React.ReactElement },
    ref: React.Ref<unknown>,
) {
    return <Slide direction="up" ref={ref} {...props} />;
});

type OpenProp = {
    open: boolean,
    setOpen: Function,
    org: I_Organization | null
    setOrgs: Function
    setPending: Function
    updateOrgUsers: Function
};

const OrgSettingsDialog = ({open, setOpen, org, setPending, setOrgs, updateOrgUsers}: OpenProp) => {
    const classes = useStyles();

    const [tabIndex, setTabIndex] = React.useState<number>(0);


    const handleClose = () => {
        setOpen(false);
        setTabIndex(0);
    };

    const handleTabChange = (event: React.ChangeEvent<{}>, newValue: number) => {
        setTabIndex(newValue);
    };

    return (
        <Dialog fullScreen open={open} onClose={handleClose} TransitionComponent={Transition}>
            <AppBar className={classes.appBar}>
                <Toolbar>
                    <IconButton edge="start" color="inherit" onClick={handleClose} aria-label="close">
                        <CloseIcon/>
                    </IconButton>
                    <Typography variant="h6" className={classes.title}>
                        Настройки организации
                    </Typography>
                </Toolbar>
            </AppBar>
            <div className={classes.mainBody}>
                <Tabs className={classes.tabs}
                      orientation='vertical'
                      value={tabIndex}
                      onChange={handleTabChange}
                      aria-label='settings-tabs'>
                    <Tab label="Информация" {...allyProps(0)} />
                    <Tab label="Пользователи" {...allyProps(0)} />
                    <Tab label="Разделы" {...allyProps(0)} />
                </Tabs>
                <Container>
                    <TabPanel index={0} value={tabIndex}>
                        <Container maxWidth="sm">
                            <OrgInfoForm org={org} setPending={setPending} setOrgs={setOrgs}/>
                        </Container>
                    </TabPanel>
                    <TabPanel index={1} value={tabIndex}>
                        <OrgUsersManager org={org} setPending={setPending} updateOrgUsers={updateOrgUsers}/>
                    </TabPanel>
                    <TabPanel index={2} value={tabIndex}>
                        <OrgFolderGroups org={org}/>
                    </TabPanel>
                </Container>
            </div>
        </Dialog>
    );
};

export default OrgSettingsDialog;