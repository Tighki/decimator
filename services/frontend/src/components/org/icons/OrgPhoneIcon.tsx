import React from 'react';
import {Phone} from "@material-ui/icons";
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

type PhoneProp = {
    orgPhone?: string
}

const OrgPhoneIcon = ({orgPhone}: PhoneProp) => {
    const classes = useStyles();
    const [anchorEl, setAnchorEl] = React.useState<HTMLElement | null>(null);

    const handlePopoverOpen = (event: any) => {
        setAnchorEl(event.currentTarget);
    };

    const handlePopoverClose = () => {
        setAnchorEl(null);
    };


    const popoverOpen = Boolean(anchorEl);

    return (
        <React.Fragment>
            <Phone color="disabled"
                   className={classes.icon}
                   aria-owns={popoverOpen ? 'phone-popover' : undefined}
                   aria-haspopup="true"
                   onMouseEnter={handlePopoverOpen}
                   onMouseLeave={handlePopoverClose}
            />
            <Popover
                id="phone-popover"
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
                onClose={handlePopoverClose}
                disableRestoreFocus
            >
                <Typography>{orgPhone}</Typography>
            </Popover>
        </React.Fragment>
    );
}

export default OrgPhoneIcon;
