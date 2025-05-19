import React from 'react';
import {Home} from "@material-ui/icons";
import Typography from '@material-ui/core/Typography';
import {makeStyles} from '@material-ui/core/styles';
import Popover from '@material-ui/core/Popover';

const useStyles = makeStyles((theme) => ({
    icon: {
        paddingRight: '5px'
    },
    popover: {
        pointerEvents: 'none',
    },
    paper: {
        padding: theme.spacing(1),
    },
}));

type AddressProp = {
    orgAddress?: string
}

const OrgAddressIcon = ({orgAddress}: AddressProp) => {
    const classes = useStyles();
    const [anchorEl, setAnchorEl] = React.useState<HTMLElement | null>(null);

    const handleOrgInfoPopoverOpen = (event: any) => {
        setAnchorEl(event.currentTarget);
    };

    const handleOrgInfoPopoverClose = () => {
        setAnchorEl(null);
    };


    const popoverOpen = Boolean(anchorEl);

    return (
        <React.Fragment>
            <Home color="disabled"
                  className={classes.icon}
                  aria-owns={popoverOpen ? 'home-popover' : undefined}
                  aria-haspopup="true"
                  onMouseEnter={handleOrgInfoPopoverOpen}
                  onMouseLeave={handleOrgInfoPopoverClose}
            />
            <Popover
                id="home-popover"
                className={classes.popover}
                classes={{
                    paper: classes.paper,
                }}
                open={popoverOpen}
                anchorEl={anchorEl}
                anchorOrigin={{
                    vertical: 'bottom',
                    horizontal: 'left',
                }}
                transformOrigin={{
                    vertical: 'top',
                    horizontal: 'left',
                }}
                onClose={handleOrgInfoPopoverClose}
                disableRestoreFocus
            >
                <Typography>{orgAddress}</Typography>
            </Popover>
        </React.Fragment>
    );
}

export default OrgAddressIcon;
