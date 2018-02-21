//@flow
import React from 'react';
import injectSheet from 'react-jss';
import ActionLink from './ActionLink';
import ActionButton from './ActionButton';
import PageNameForm from './PageNameForm';
import { withRouter } from 'react-router-dom';

const styles = {
    header: {
        borderBottom: '1px solid #ddd'
    },
    actions: {
        marginBottom: '1em'
    }
};

type Props = {
    page: any,
    wiki: any,
    onDeleteClick: () => void,
    onHomeClick: () => void,
    onOkMoveClick: () => void,
    history: any,
    classes: any
}

type State = {
    showCreateForm: boolean,
    showMoveForm: boolean
};

class PageHeader extends React.Component<Props,State> {

    constructor(props) {
        super(props);
        this.state =  {
            showCreateForm: false
        };
    }

    onCreateClick = () =>  {
        this.setState({
            showCreateForm: true
        });
    };

    onAbortCreateClick = () => {
        this.setState({
            showCreateForm: false
        });
    };

    onOkCreate = (name) => {
        const { repository, branch } = this.props.wiki;

        let path = `/${repository}/${branch}`;

        if (name.startsWith('/')) {
            path = `${path}${name}`;
        } else {
            path = `${path}/docs/${name}`;
        }

        this.props.history.push(path);
    };

    onMoveClick = () => {
        this.setState({
            showMoveForm: true
        });
    };

    onAbortMoveClick = () => {
        this.setState({
            showMoveForm: false
        });
    };


    render() {
        const { page, classes, onDeleteClick, onHomeClick, onOkMoveClick } = this.props;

        const homeButton = <ActionButton onClick={onHomeClick}  i18nKey="page-header_home" type="primary" />;
        const createButton = <ActionButton onClick={this.onCreateClick} i18nKey="page-header_create" type="primary" />;
        const edit = page._links.edit ? <ActionLink to="?edit=true" i18nKey="page-header_edit" type="primary" /> : '';
        const moveButton = page._links.move ? <ActionButton onClick={this.onMoveClick} i18nKey="page-header_move" type="primary" /> : '';
        const deleteButton = page._links.delete ? <ActionButton onClick={onDeleteClick} i18nKey="page-header_delete" type="primary" /> : '';
        const createForm = <PageNameForm show={ this.state.showCreateForm } onOk={ this.onOkCreate } onAbortClick={ this.onAbortCreateClick } labelPrefix="create" />
        const moveForm = <PageNameForm show={ this.state.showMoveForm } onOk={ onOkMoveClick } onAbortClick={ this.onAbortMoveClick } labelPrefix="move" />

        return (
            <div className={classes.header}>
                <h1>{ page.path }</h1>
                <div className={classes.actions}>
                    {homeButton}
                    {createButton}
                    {moveButton}
                    {edit}
                    {deleteButton}
                </div>
                {createForm}
                {moveForm}
            </div>
        );
    }

}

export default withRouter(injectSheet(styles)(PageHeader));
