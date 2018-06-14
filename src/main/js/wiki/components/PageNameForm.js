//@flow
import React from 'react';
import {Modal} from 'react-bootstrap';
import {translate} from 'react-i18next';
import ActionButton from './ActionButton';
import injectSheet from 'react-jss';
import classNames from 'classnames';
import PathValidationNote from "./PathValidationNote";

const styles = {
    directoryLabel: {
        paddingRight: 0
    },
    nameInput: {
        paddingRight: '15px'
    },
    noHorizontalPadding: {
        paddingLeft: 0,
        paddingRight: 0
    }
};

type Props = {
    t: any,
    initialValue: string,
    directory: string,
    labelPrefix: string,
    show: boolean,
    onOk: Function,
    onAbortClick: Function,
    classes: any
};

type State = {
    name: string
};

class PageNameForm extends React.Component<Props, State> {

    constructor(props) {
        super(props);

        this.state = {
            name: props.initialValue ? props.initialValue : ''
        };
    }

    handleChange = (event) => {
        this.setState({name: event.target.value});
    };

    onOkClick = () => {
        this.props.onOk(this.state.name);
    };

    validPage = () => {
        const pageName = this.state.name;
        return this.isPageNameValid(pageName);
    };

    isPageNameValid(pageName: string) {
        if (pageName === this.props.initialValue) {
            return false;
        }
        const decoded = decodeURI(pageName);
        if (decoded.includes('..') || decoded.startsWith('/') || decoded.includes('//')){
            return false;
        }
        if (!decoded.match(/^[a-zA-Z.\-_/]+$/)) {
            return false;
        }
        return !(decoded.includes('?') || decoded.includes('!'));

    }

    render() {
        const { classes, directory, show, onAbortClick, t, labelPrefix } = this.props;

        const isButtonEnabled = this.validPage();
        return (
            <Modal show={ show } onHide={onAbortClick}>
                <Modal.Header closeButton>
                    <Modal.Title>{ t(`${labelPrefix}-form_title`) }</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <form className="form-horizontal">
                        <div className="form-group">
                            <label className={classNames("col-xs-2", "control-label", classes.directoryLabel)}>{directory}/</label>
                            <div className="col-xs-9">
                                <input type="text" className={classNames("form-control", classes.nameInput)} value={this.state.name} onChange={ this.handleChange } />
                            </div>
                            <div className={classNames("col-xs-1", classes.noHorizontalPadding)}>
                                <PathValidationNote />
                            </div>
                        </div>
                    </form>
                </Modal.Body>
                <Modal.Footer>
                    <ActionButton disabled={!isButtonEnabled} type="primary" onClick={this.onOkClick} i18nKey={labelPrefix+"-form_ok"} />
                    <ActionButton onClick={onAbortClick} i18nKey={labelPrefix+"-form_abort"} />
                </Modal.Footer>
            </Modal>
        );
    }

}

export default injectSheet(styles)(translate()(PageNameForm));
