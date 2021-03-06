//@flow
import React from 'react';
import {editPage, createPage, createPageUrl, fetchPageIfNeeded, deletePage, movePage, restorePage} from '../modules/page';
import {createId, fetchWikiIfNeeded} from '../modules/wiki';
import {connect} from 'react-redux';
import PageViewer from '../components/PageViewer';
import * as queryString from 'query-string';
import PageEditor from '../components/PageEditor';
import Loading from '../../Loading';
import I18nAlert from '../../I18nAlert';

type Props = {
    historyLink: string,
    pagesLink: string,
    url: string,
    path: string,
    loading: boolean,
    notFound: boolean,
    editMode: boolean,
    error: any,
    page: any,
    wiki:any,
    repository: string,
    branch: string,
    history: any,
    fetchPageIfNeeded: (url: string) => void,
    fetchWikiIfNeeded: (repository: string, branch: string) => void,
    editPage: (url: string, message: string, content: string) => void,
    createPage: (url: string, message: string, content: string) => void,
    onDelete: (url: string, message: string, callback: () => void) => void,
    restorePage: (url: string, message: string, commit: string) => void
};

class Page extends React.Component<Props> {

    componentDidMount() {
        const { url, repository, branch } = this.props;
        this.props.fetchPageIfNeeded(url);
        this.props.fetchWikiIfNeeded(repository, branch);
    }

    componentDidUpdate() {
        this.props.fetchPageIfNeeded(this.props.url);
    }

    edit = (message: string, content: string) => {
        this.props.editPage(this.props.url, message, content);
    };

    create = (message: string, content: string) => {
        this.props.createPage(this.props.url, message, content);
    };

    pushLandingPageState = () => {
        this.pushPageStateClosure(this.props.wiki.landingPage)();
    };

    delete = () => {
        const { path, url, deletePage } = this.props;
        // TODO i18n
        const message = 'Delete page ' + path + ' (smeagol)';
        deletePage(url, message, this.pushLandingPageState);
    };

    onMove = (target: string) => {
        const { path, url, movePage } = this.props;
        // TODO i18n
        const message = 'Move page ' + path + ' to ' + target + ' (smeagol)';
        movePage(url, message, target, this.pushPageStateClosure(target));
    };

    onRestore = (pagePath: string, commit: string) => {
        const { restorePage, repository, branch } = this.props;
        // TODO i18n
        const message = 'Restore commit ' + commit + ' from page '+ pagePath + ' (smeagol)';
        const apiPath = createPageUrl(repository, branch, pagePath);
        restorePage(apiPath, message, commit, this.pushPageStateClosure(pagePath));
    };

    pushPageStateClosure = (pagePath: string) => {
        const { history, repository, branch } = this.props;
        return function() {
            history.push(`/${repository}/${branch}/${pagePath}`);
        }
    };

    onAbortEdit= () => {
        const { history } = this.props;
        history.push('?');
    };

    onAbortCreate = () => {
        this.pushLandingPageState();
    };

    search = (query: string) => {
        const { history, repository, branch } = this.props;
        history.push(`/${repository}/${branch}/search?query=${query}`);
    };

    render() {
        const { error, loading, page, wiki, repository, branch, path, notFound, editMode, pagesLink, historyLink } = this.props;
        wiki.repository = repository;
        wiki.branch = branch;

        if (error) {
            return (
                <div>
                    <h1>Smeagol</h1>
                    <I18nAlert i18nKey="page_failed_to_fetch" />
                </div>
            );
        } else if (loading) {
            return (
                <div>
                    <h1>Smeagol</h1>
                    <Loading/>
                </div>
            );
        } else if (notFound) {
            return (
                <PageEditor path={path} content="" onSave={this.create} onAbort={this.onAbortCreate} />
            );
        } else if (!page) {
            return (
                <div>
                    <h1>Smeagol</h1>
                </div>
            );
        }

        if (editMode) {
            return <PageEditor path={page.path} content={page.content} onSave={this.edit} onAbort={this.onAbortEdit} />;
        }

        return <PageViewer page={page} wiki={wiki} onDelete={ this.delete } onHome={ this.pushLandingPageState }
                           onMove={ this.onMove } pagesLink={pagesLink} historyLink={historyLink}
                           onRestore={this.onRestore} search={this.search}/>;

    }
}

function isEditMode(props): boolean {
    const queryParams = queryString.parse(props.location.search);
    return queryParams.edit === 'true';
}

function isCommitPage(props): boolean {
    const queryParams = queryString.parse(props.location.search);
    return queryParams.commit !== undefined;
}

function getCommitParameter(props): boolean {
    const queryParams = queryString.parse(props.location.search);
    return queryParams.commit;
}

function findPagePath(props) {
    const { pathname } = props.location;
    const parts = pathname.split('/');
    return parts.slice(3).join('/');
}


const mapStateToProps = (state, ownProps) => {
    const { repository, branch } = ownProps.match.params;
    const path = findPagePath(ownProps);

    let url = createPageUrl(repository, branch, path);
    if(isCommitPage(ownProps)){
        url += '?commit=' + getCommitParameter(ownProps);
    }

    const wikiId = createId(repository, branch);
    const stateWiki = state.wiki[wikiId] || {};

    let pagesLink = '#';
    let historyLink = '#';
    if (stateWiki.wiki && stateWiki.wiki.directory) {
        pagesLink = `/${repository}/${branch}/pages/${stateWiki.wiki.directory}`;
        historyLink = `/${repository}/${branch}/history/${path}`;
        // TODO check for polyfill
        if (!pagesLink.endsWith('/')) {
            pagesLink += '/';
        }
    }

    const props = {
        ...state.page[url],
        pagesLink,
        historyLink,
        path,
        url,
        repository,
        branch,
        editMode: isEditMode(ownProps),
        commitPage: isCommitPage(ownProps),
        wiki: stateWiki.wiki || {}
    };

    return props;
};

const mapDispatchToProps = (dispatch) => {
    return {
        fetchWikiIfNeeded: (repository: string, branch: string) => {
            dispatch(fetchWikiIfNeeded(repository, branch))
        },
        fetchPageIfNeeded: (url: string) => {
            dispatch(fetchPageIfNeeded(url))
        },
        editPage: (url: string, message: string, content: string) => {
            dispatch(editPage(url, message, content))
        },
        createPage: (url: string, message: string, content: string) => {
            dispatch(createPage(url, message, content))
        },
        deletePage: (url: string, message: string, callback: () => void) => {
            dispatch(deletePage(url, message, callback))
        },
        movePage: (url: string, message: string, target: string, callback: (target) => void) => {
            dispatch(movePage(url, message, target, callback))
        },
        restorePage: (url: string, message: string, commit: string, callback: () => void) => {
            dispatch(restorePage(url, message, commit, callback))
        }
    }
};

export default connect(mapStateToProps, mapDispatchToProps)(Page);
