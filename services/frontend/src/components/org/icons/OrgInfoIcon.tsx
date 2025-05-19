import React from 'react';
import {Info} from "@material-ui/icons";
import Typography from '@material-ui/core/Typography';
import {makeStyles} from '@material-ui/core/styles';
import Popover from '@material-ui/core/Popover';

const useStyles = makeStyles((theme) => ({
    popover: {
        pointerEvents: 'none',
    },
    paper: {
        padding: theme.spacing(1),
    },
}));

type InfoProp = {
    orgInfo?: string
}

const OrgInfoIcon = ({orgInfo}: InfoProp) => {
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
            <Info color="disabled"
                  aria-owns={popoverOpen ? 'info-popover' : undefined}
                  aria-haspopup="true"
                  onMouseEnter={handlePopoverOpen}
                  onMouseLeave={handlePopoverClose}
            />
            <Popover
                id="info-popover"
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
                <Typography>{orgInfo}</Typography>
            </Popover>
        </React.Fragment>
    );
}

export default OrgInfoIcon;
