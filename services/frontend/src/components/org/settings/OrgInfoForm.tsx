import {createStyles, makeStyles, Theme} from "@material-ui/core/styles";
import React from "react";
import {Button, TextField} from "@material-ui/core";
import {I_Organization, I_OrganizationBase} from "../../../types/org";
import {getToken} from "../../../utils/auth";
import {useToasts} from "react-toast-notifications";

const useStyles = makeStyles((theme: Theme) =>
    createStyles({
        form: {
            width: '100%',
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
        saveInfoButton: {
            marginTop: 20
        }
    }),
);

type OrgInfoProp = {
    org: I_Organization | null
    setPending: Function
    setOrgs: Function
};

const OrgInfoForm = ({org, setPending, setOrgs}: OrgInfoProp) => {
    const classes = useStyles();
    const {addToast} = useToasts();

    const [name, setName] = React.useState<string | undefined>(org?.name);
    const [description, setDescription] = React.useState<string | undefined | null>(org?.description);
    const [address, setAddress] = React.useState<string | undefined | null>(org?.address);
    const [phone, setPhone] = React.useState<string | undefined | null>(org?.phone);
    const [code, setCode] = React.useState<string | null | undefined>(org?.code);

    const updateOrgInfo = (org: any, org_id: string | undefined) => {
        const headers = new Headers();

        let token = getToken()
        headers.append("Authorization", token);
        headers.append("Accept", 'application/json');

        const options = {
            method: 'PATCH',
            body: JSON.stringify(org),
            headers
        };

        const route = `http://${process.env.REACT_APP_API_URI}/api/v1/orgs/${org_id}`;
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
                // addToast('Информация обновлена!', {
                //     appearance: 'success',
                //     autoDismiss: true,
                // });
                setOrgs(res);
            })
            .catch(error => {
                addToast('При обновлении информации произошла ошибка...', {
                    appearance: 'error',
                    autoDismiss: true,
                });
            });
    };

    const saveUpdates = (event: any) => {
        event.preventDefault();
        updateOrgInfo({name, description, address, phone, code}, org?._id);
    }

    const handleChange = (event: any) => {
        event.preventDefault();

        switch (event.target.id) {
            case 'phone': {
                setPhone(event.target.value);
                break;
            }
            case 'name': {
                setName(event.target.value);
                break;
            }
            case 'description': {
                setDescription(event.target.value);
                break;
            }
            case 'address': {
                setAddress(event.target.value);
                break;
            }
            case 'code': {
                setCode(event.target.value);
                break;
            }
        }
    };
    return (
        <form className={classes.form} noValidate>
            <TextField
                autoFocus
                variant="outlined"
                margin="normal"
                required
                fullWidth
                label="Название"
                name="name"
                id="name"
                value={name}
                onChange={handleChange}
            />
            <TextField
                type="text"
                rows={4}
                variant="outlined"
                margin="normal"
                fullWidth
                multiline
                label="Описание"
                name="description"
                id="description"
                value={description}
                onChange={handleChange}
            />
            <TextField
                type="text"
                variant="outlined"
                margin="normal"
                fullWidth
                label="Адрес"
                name="address"
                id="address"
                value={address}
                onChange={handleChange}
            />
            <div className={classes.phone_and_code}>
                <TextField
                    className={classes.number}
                    type="text"
                    variant="outlined"
                    margin="normal"
                    fullWidth
                    label="Телефон"
                    name="phone"
                    id="phone"
                    value={phone}
                    onChange={handleChange}
                />
                <TextField
                    type="text"
                    variant="outlined"
                    margin="normal"
                    required
                    fullWidth
                    label="Код"
                    name="code"
                    id="code"
                    value={code}
                    onChange={handleChange}
                />
            </div>
            <Button className={classes.saveInfoButton}
                    color='primary'
                    variant='contained'
                    onClick={saveUpdates}
                    fullWidth
            >
                Сохранить
            </Button>
        </form>
    );
};

export default OrgInfoForm;